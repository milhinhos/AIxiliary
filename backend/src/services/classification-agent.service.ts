import OpenAI from 'openai';
import { config } from '../config';
import { ClassificationConfig, ClassificationResult } from '../types';

export class ClassificationAgentService {
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({
      apiKey: config.openai.apiKey,
    });
  }

  /**
   * Classify a file and extract information based on the configuration prompt
   */
  async classifyFile(
    fileContent: string,
    fileName: string,
    classificationConfig: ClassificationConfig
  ): Promise<Omit<ClassificationResult, 'fileId'>> {
    try {
      const systemPrompt = this.buildSystemPrompt(classificationConfig);
      const userPrompt = this.buildUserPrompt(fileContent, fileName);

      const completion = await this.openai.chat.completions.create({
        model: classificationConfig.model || config.openai.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.3,
        response_format: { type: 'json_object' },
      });

      const response = completion.choices[0]?.message?.content;

      if (!response) {
        throw new Error('No response from OpenAI');
      }

      const parsedResponse = JSON.parse(response);

      return {
        fileName,
        classification: parsedResponse.classification || 'Unknown',
        extractedInfo: parsedResponse.extractedInfo || {},
        confidence: parsedResponse.confidence,
        processedAt: new Date(),
      };
    } catch (error) {
      console.error(`Error classifying file ${fileName}:`, error);
      return {
        fileName,
        classification: 'Error',
        extractedInfo: {},
        processedAt: new Date(),
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Build system prompt from configuration
   */
  private buildSystemPrompt(config: ClassificationConfig): string {
    let prompt = `You are a file classification assistant. Your task is to analyze file contents and provide structured classification results.

${config.prompt}

You must respond in JSON format with the following structure:
{
  "classification": "the category or type of the document",
  "extractedInfo": {
    // key-value pairs of extracted information
  },
  "confidence": 0.95 // optional confidence score between 0 and 1
}`;

    if (config.categories && config.categories.length > 0) {
      prompt += `\n\nAvailable categories: ${config.categories.join(', ')}`;
    }

    if (config.extractionFields && config.extractionFields.length > 0) {
      prompt += `\n\nExtract the following fields when available: ${config.extractionFields.join(', ')}`;
    }

    return prompt;
  }

  /**
   * Build user prompt with file content
   */
  private buildUserPrompt(fileContent: string, fileName: string): string {
    // Limit content length to avoid token limits
    const maxContentLength = 50000; // Adjust based on model limits
    const truncatedContent =
      fileContent.length > maxContentLength
        ? fileContent.substring(0, maxContentLength) + '\n\n[Content truncated...]'
        : fileContent;

    return `File Name: ${fileName}

File Content:
${truncatedContent}

Please analyze this file and provide the classification and extracted information in JSON format.`;
  }

  /**
   * Batch classify multiple files
   */
  async classifyFiles(
    files: Array<{ content: string; fileName: string; fileId: string }>,
    classificationConfig: ClassificationConfig
  ): Promise<ClassificationResult[]> {
    const results: ClassificationResult[] = [];

    for (const file of files) {
      try {
        const result = await this.classifyFile(file.content, file.fileName, classificationConfig);
        results.push({
          ...result,
          fileId: file.fileId,
        });
      } catch (error) {
        console.error(`Error processing file ${file.fileName}:`, error);
        results.push({
          fileId: file.fileId,
          fileName: file.fileName,
          classification: 'Error',
          extractedInfo: {},
          processedAt: new Date(),
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return results;
  }
}

export const classificationAgentService = new ClassificationAgentService();
