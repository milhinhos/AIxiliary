import { ChatOpenAI } from '@langchain/openai';
import { PromptTemplate } from '@langchain/core/prompts';
import { StructuredOutputParser } from 'langchain/output_parsers';
import { z } from 'zod';
import { config } from '../config';
import { AgentType } from './configs';

export class OrchestratorAgent {
  private model: ChatOpenAI;
  private parser: StructuredOutputParser<any>;

  constructor() {
    this.model = new ChatOpenAI({
      openAIApiKey: config.openai.apiKey,
      modelName: 'gpt-4-turbo-preview',
      temperature: 0.2,
    });

    // Define the output schema for classification
    const outputSchema = z.object({
      documentType: z.enum([
        'id-card',
        'tax-declaration',
        'justice-declaration',
        'bank-authority',
        'fin-process',
        'unknown',
      ]),
      confidence: z.number().min(0).max(1),
      reasoning: z.string(),
    });

    this.parser = StructuredOutputParser.fromZodSchema(outputSchema);
  }

  /**
   * Classify a document and route it to the appropriate specialized agent
   */
  async classifyDocument(
    fileName: string,
    fileContent: string
  ): Promise<{
    documentType: AgentType | 'unknown';
    confidence: number;
    reasoning: string;
  }> {
    const formatInstructions = this.parser.getFormatInstructions();

    const prompt = PromptTemplate.fromTemplate(`You are a document classification orchestrator for Portuguese credit application documents.
Your task is to analyze the document and determine its type so it can be routed to the appropriate specialized agent.

Available document types:
1. id-card: Portuguese ID cards (Cartão de Cidadão) or other identification documents
2. tax-declaration: Tax declarations, IRS forms, or tax-related certificates
3. justice-declaration: Criminal record certificates (Certificado de Registo Criminal) or justice-related declarations
4. bank-authority: Portuguese Central Bank declarations (Mapa de Responsabilidades de Crédito from Banco de Portugal)
5. fin-process: FIN process outcomes with standardized bank loan proposals
6. unknown: If the document doesn't match any of the above categories

File Name: {fileName}

File Content Preview (first 2000 characters):
{fileContent}

Based on the file name and content, classify this document.
Consider:
- Document headers and titles
- Issuing authority mentioned
- Type of information present
- Document structure and format
- Portuguese legal/financial terminology

{formatInstructions}

Provide your classification with confidence score (0-1) and reasoning.`);

    const input = await prompt.format({
      fileName,
      fileContent: fileContent.substring(0, 2000),
      formatInstructions,
    });

    const response = await this.model.invoke(input);
    const parsed = await this.parser.parse(response.content as string);

    return {
      documentType: parsed.documentType as AgentType | 'unknown',
      confidence: parsed.confidence,
      reasoning: parsed.reasoning,
    };
  }

  /**
   * Batch classify multiple documents
   */
  async classifyDocuments(
    files: Array<{ fileName: string; content: string }>
  ): Promise<
    Array<{
      fileName: string;
      documentType: AgentType | 'unknown';
      confidence: number;
      reasoning: string;
    }>
  > {
    const results = [];

    for (const file of files) {
      try {
        const classification = await this.classifyDocument(file.fileName, file.content);
        results.push({
          fileName: file.fileName,
          ...classification,
        });
      } catch (error) {
        console.error(`Error classifying file ${file.fileName}:`, error);
        results.push({
          fileName: file.fileName,
          documentType: 'unknown' as const,
          confidence: 0,
          reasoning: `Error during classification: ${error}`,
        });
      }
    }

    return results;
  }
}

export const orchestratorAgent = new OrchestratorAgent();
