import { orchestratorAgent } from '../agents/orchestrator.agent';
import { specializedAgent, ExtractionResult } from '../agents/specialized.agent';
import { oneDriveService } from './onedrive.service';
import { fileProcessorService } from './file-processor.service';
import { excelExportService } from './excel-export.service';
import { AgentType } from '../agents/configs';

export interface ProcessingResult {
  fileName: string;
  fileId: string;
  documentType: AgentType | 'unknown';
  classificationConfidence: number;
  extractedData: Record<string, any>;
  processingStatus: 'success' | 'error' | 'skipped';
  error?: string;
}

export class DocumentProcessorService {
  /**
   * Process a single folder from OneDrive
   */
  async processFolderFromOneDrive(
    accessToken: string,
    folderId: string
  ): Promise<{
    results: ProcessingResult[];
    excelBuffer?: Buffer;
    summary: {
      totalFiles: number;
      processedFiles: number;
      errorFiles: number;
      skippedFiles: number;
      documentTypes: Record<string, number>;
    };
  }> {
    console.log(`Processing folder ${folderId} from OneDrive...`);

    // List all files in the folder
    const files = await oneDriveService.listFiles(accessToken, folderId);
    console.log(`Found ${files.length} files in folder`);

    // Filter to only PDF and image files
    const supportedFiles = files.filter((file) => {
      const fileName = file.name.toLowerCase();
      const mimeType = file.mimeType.toLowerCase();

      return (
        fileName.endsWith('.pdf') ||
        mimeType === 'application/pdf' ||
        fileName.endsWith('.jpg') ||
        fileName.endsWith('.jpeg') ||
        fileName.endsWith('.png') ||
        fileName.endsWith('.gif') ||
        fileName.endsWith('.bmp') ||
        fileName.endsWith('.tiff') ||
        mimeType.startsWith('image/')
      );
    });

    console.log(`${supportedFiles.length} supported files (PDF/images) found`);

    const results: ProcessingResult[] = [];
    const documentTypeCounts: Record<string, number> = {};

    // Process each file
    for (const file of supportedFiles) {
      try {
        console.log(`Processing file: ${file.name}`);

        // Download file from OneDrive
        const fileBuffer = await oneDriveService.downloadFile(accessToken, file.id);

        // Extract content (text or image marker)
        const content = await fileProcessorService.extractTextContent(
          fileBuffer,
          file.mimeType,
          file.name
        );

        // Classify document type using orchestrator
        const classification = await orchestratorAgent.classifyDocument(file.name, content);
        console.log(
          `Classified ${file.name} as ${classification.documentType} (confidence: ${classification.confidence})`
        );

        // Skip if unknown document type
        if (classification.documentType === 'unknown') {
          results.push({
            fileName: file.name,
            fileId: file.id,
            documentType: 'unknown',
            classificationConfidence: classification.confidence,
            extractedData: {},
            processingStatus: 'skipped',
            error: 'Unknown document type',
          });
          continue;
        }

        // Process with specialized agent
        const extraction = await specializedAgent.processDocument(
          classification.documentType,
          file.name,
          content,
          fileBuffer,
          file.mimeType
        );

        // Track document type counts
        documentTypeCounts[classification.documentType] =
          (documentTypeCounts[classification.documentType] || 0) + 1;

        results.push({
          fileName: file.name,
          fileId: file.id,
          documentType: classification.documentType,
          classificationConfidence: classification.confidence,
          extractedData: extraction.extractedData,
          processingStatus: extraction.error ? 'error' : 'success',
          error: extraction.error,
        });
      } catch (error) {
        console.error(`Error processing file ${file.name}:`, error);
        results.push({
          fileName: file.name,
          fileId: file.id,
          documentType: 'unknown',
          classificationConfidence: 0,
          extractedData: {},
          processingStatus: 'error',
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    // Generate Excel export
    let excelBuffer: Buffer | undefined;
    try {
      const exportResults = results.map((r) => ({
        fileName: r.fileName,
        documentType: r.documentType,
        confidence: r.classificationConfidence,
        extractedData: r.extractedData,
        error: r.error,
      }));

      excelBuffer = await excelExportService.exportWithSummary(exportResults, {
        title: 'Credit Application Processing Results',
      });
    } catch (error) {
      console.error('Error generating Excel export:', error);
    }

    // Calculate summary
    const summary = {
      totalFiles: supportedFiles.length,
      processedFiles: results.filter((r) => r.processingStatus === 'success').length,
      errorFiles: results.filter((r) => r.processingStatus === 'error').length,
      skippedFiles: results.filter((r) => r.processingStatus === 'skipped').length,
      documentTypes: documentTypeCounts,
    };

    return {
      results,
      excelBuffer,
      summary,
    };
  }

  /**
   * Process files from uploaded buffers (alternative to OneDrive)
   */
  async processUploadedFiles(
    files: Array<{
      fileName: string;
      buffer: Buffer;
      mimeType: string;
    }>
  ): Promise<{
    results: ProcessingResult[];
    excelBuffer?: Buffer;
    summary: {
      totalFiles: number;
      processedFiles: number;
      errorFiles: number;
      skippedFiles: number;
      documentTypes: Record<string, number>;
    };
  }> {
    console.log(`Processing ${files.length} uploaded files...`);

    const results: ProcessingResult[] = [];
    const documentTypeCounts: Record<string, number> = {};

    for (const file of files) {
      try {
        console.log(`Processing file: ${file.fileName}`);

        // Extract content
        const content = await fileProcessorService.extractTextContent(
          file.buffer,
          file.mimeType,
          file.fileName
        );

        // Classify document type
        const classification = await orchestratorAgent.classifyDocument(file.fileName, content);
        console.log(
          `Classified ${file.fileName} as ${classification.documentType} (confidence: ${classification.confidence})`
        );

        if (classification.documentType === 'unknown') {
          results.push({
            fileName: file.fileName,
            fileId: 'uploaded',
            documentType: 'unknown',
            classificationConfidence: classification.confidence,
            extractedData: {},
            processingStatus: 'skipped',
            error: 'Unknown document type',
          });
          continue;
        }

        // Process with specialized agent
        const extraction = await specializedAgent.processDocument(
          classification.documentType,
          file.fileName,
          content,
          file.buffer,
          file.mimeType
        );

        documentTypeCounts[classification.documentType] =
          (documentTypeCounts[classification.documentType] || 0) + 1;

        results.push({
          fileName: file.fileName,
          fileId: 'uploaded',
          documentType: classification.documentType,
          classificationConfidence: classification.confidence,
          extractedData: extraction.extractedData,
          processingStatus: extraction.error ? 'error' : 'success',
          error: extraction.error,
        });
      } catch (error) {
        console.error(`Error processing file ${file.fileName}:`, error);
        results.push({
          fileName: file.fileName,
          fileId: 'uploaded',
          documentType: 'unknown',
          classificationConfidence: 0,
          extractedData: {},
          processingStatus: 'error',
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    // Generate Excel export
    let excelBuffer: Buffer | undefined;
    try {
      const exportResults = results.map((r) => ({
        fileName: r.fileName,
        documentType: r.documentType,
        confidence: r.classificationConfidence,
        extractedData: r.extractedData,
        error: r.error,
      }));

      excelBuffer = await excelExportService.exportWithSummary(exportResults, {
        title: 'Credit Application Processing Results',
      });
    } catch (error) {
      console.error('Error generating Excel export:', error);
    }

    const summary = {
      totalFiles: files.length,
      processedFiles: results.filter((r) => r.processingStatus === 'success').length,
      errorFiles: results.filter((r) => r.processingStatus === 'error').length,
      skippedFiles: results.filter((r) => r.processingStatus === 'skipped').length,
      documentTypes: documentTypeCounts,
    };

    return {
      results,
      excelBuffer,
      summary,
    };
  }

  /**
   * Export results to different formats
   */
  async exportResults(
    results: ProcessingResult[],
    format: 'excel' | 'json' | 'csv' = 'excel'
  ): Promise<Buffer | string> {
    const exportData = results.map((r) => ({
      fileName: r.fileName,
      documentType: r.documentType,
      confidence: r.classificationConfidence,
      extractedData: r.extractedData,
      error: r.error,
    }));

    switch (format) {
      case 'excel':
        return await excelExportService.exportWithSummary(exportData);
      case 'json':
        return excelExportService.exportToJSON(exportData);
      case 'csv':
        return excelExportService.exportToCSV(exportData);
      default:
        throw new Error(`Unsupported export format: ${format}`);
    }
  }
}

export const documentProcessorService = new DocumentProcessorService();
