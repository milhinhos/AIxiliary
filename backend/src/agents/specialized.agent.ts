import { ChatOpenAI } from '@langchain/openai';
import { HumanMessage } from '@langchain/core/messages';
import { PromptTemplate } from '@langchain/core/prompts';
import { StructuredOutputParser } from 'langchain/output_parsers';
import { config } from '../config';
import { AgentConfig, AgentType, agentConfigs } from './configs';
import { fileProcessorService } from '../services/file-processor.service';

export interface ExtractionResult {
  documentType: AgentType;
  extractedData: Record<string, any>;
  confidence?: number;
  rawResponse?: string;
  error?: string;
}

export class SpecializedAgent {
  private textModel: ChatOpenAI;
  private visionModel: ChatOpenAI;

  constructor() {
    this.textModel = new ChatOpenAI({
      openAIApiKey: config.openai.apiKey,
      modelName: 'gpt-4-turbo-preview',
      temperature: 0.3,
    });

    this.visionModel = new ChatOpenAI({
      openAIApiKey: config.openai.apiKey,
      modelName: 'gpt-4-vision-preview',
      temperature: 0.3,
      maxTokens: 4096,
    });
  }

  /**
   * Process a document with the appropriate specialized agent
   */
  async processDocument(
    documentType: AgentType,
    fileName: string,
    content: string,
    buffer?: Buffer,
    mimeType?: string
  ): Promise<ExtractionResult> {
    const agentConfig = agentConfigs[documentType];

    if (!agentConfig) {
      throw new Error(`No configuration found for document type: ${documentType}`);
    }

    try {
      // Check if this is an image file that needs vision processing
      const isImageFile =
        content === '[IMAGE_FILE_REQUIRES_VISION_PROCESSING]' &&
        buffer &&
        mimeType &&
        fileProcessorService.isImageFile(mimeType, fileName);

      if (isImageFile && agentConfig.supportsImages) {
        return await this.processWithVision(documentType, agentConfig, fileName, buffer!, mimeType!);
      } else {
        return await this.processWithText(documentType, agentConfig, fileName, content);
      }
    } catch (error) {
      console.error(`Error processing document ${fileName} with ${documentType} agent:`, error);
      return {
        documentType,
        extractedData: {},
        error: error instanceof Error ? error.message : 'Unknown error during processing',
      };
    }
  }

  /**
   * Process document with text-based model
   */
  private async processWithText(
    documentType: AgentType,
    agentConfig: AgentConfig,
    fileName: string,
    content: string
  ): Promise<ExtractionResult> {
    const prompt = PromptTemplate.fromTemplate(`{systemPrompt}

File Name: {fileName}

Document Content:
{content}

Extract the requested information and return it as a JSON object.
The JSON should have the following structure:
{{
  "extractedData": {{
    // key-value pairs of extracted information based on the fields specified
  }},
  "confidence": 0.95 // optional: your confidence in the extraction (0-1)
}}

Ensure all field names match those specified in the extraction requirements.
If a field is not found or not applicable, set it to null.`);

    const systemPrompt = this.buildSystemPrompt(agentConfig);

    const input = await prompt.format({
      systemPrompt,
      fileName,
      content: content.substring(0, 50000), // Limit content length
    });

    const response = await this.textModel.invoke(input);
    const responseText = response.content as string;

    // Try to parse JSON response
    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          documentType,
          extractedData: parsed.extractedData || parsed,
          confidence: parsed.confidence,
          rawResponse: responseText,
        };
      }
    } catch (parseError) {
      console.warn('Failed to parse JSON response, returning raw response');
    }

    return {
      documentType,
      extractedData: {},
      rawResponse: responseText,
      error: 'Failed to parse structured response',
    };
  }

  /**
   * Process document with vision model (for images and PDFs)
   */
  private async processWithVision(
    documentType: AgentType,
    agentConfig: AgentConfig,
    fileName: string,
    buffer: Buffer,
    mimeType: string
  ): Promise<ExtractionResult> {
    const base64Image = fileProcessorService.bufferToBase64(buffer, mimeType);
    const systemPrompt = this.buildSystemPrompt(agentConfig);

    const message = new HumanMessage({
      content: [
        {
          type: 'text',
          text: `${systemPrompt}

File Name: ${fileName}

Analyze the image and extract the requested information.
Return the information as a JSON object with the following structure:
{
  "extractedData": {
    // key-value pairs of extracted information
  },
  "confidence": 0.95 // your confidence in the extraction
}

Ensure all field names match those specified in the extraction requirements.`,
        },
        {
          type: 'image_url',
          image_url: {
            url: base64Image,
          },
        },
      ],
    });

    const response = await this.visionModel.invoke([message]);
    const responseText = response.content as string;

    // Try to parse JSON response
    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          documentType,
          extractedData: parsed.extractedData || parsed,
          confidence: parsed.confidence,
          rawResponse: responseText,
        };
      }
    } catch (parseError) {
      console.warn('Failed to parse JSON response from vision model');
    }

    return {
      documentType,
      extractedData: {},
      rawResponse: responseText,
      error: 'Failed to parse structured response from vision model',
    };
  }

  /**
   * Build system prompt from agent configuration
   */
  private buildSystemPrompt(agentConfig: AgentConfig): string {
    let prompt = agentConfig.prompt;

    if (agentConfig.extractionFields && agentConfig.extractionFields.length > 0) {
      prompt += `\n\nExtract the following fields:\n${agentConfig.extractionFields.join(', ')}`;
    }

    if (agentConfig.categories && agentConfig.categories.length > 0) {
      prompt += `\n\nPossible document categories:\n${agentConfig.categories.join(', ')}`;
    }

    return prompt;
  }

  /**
   * Batch process multiple documents
   */
  async processDocuments(
    documents: Array<{
      documentType: AgentType;
      fileName: string;
      content: string;
      buffer?: Buffer;
      mimeType?: string;
    }>
  ): Promise<ExtractionResult[]> {
    const results: ExtractionResult[] = [];

    for (const doc of documents) {
      const result = await this.processDocument(
        doc.documentType,
        doc.fileName,
        doc.content,
        doc.buffer,
        doc.mimeType
      );
      results.push(result);
    }

    return results;
  }
}

export const specializedAgent = new SpecializedAgent();
