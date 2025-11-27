import { FileSubmission, ClassificationConfig, ClassificationResult } from '../types';
import { oneDriveService } from './onedrive.service';
import { fileProcessorService } from './file-processor.service';
import { classificationAgentService } from './classification-agent.service';
import { documentProcessorService, ProcessingResult } from './document-processor.service';
import { v4 as uuidv4 } from 'uuid';

// In-memory storage for submissions (replace with database in production)
const submissions = new Map<string, FileSubmission>();

// Extended submission type for new processing
export interface ExtendedFileSubmission extends FileSubmission {
  processingResults?: ProcessingResult[];
  excelBuffer?: Buffer;
  processingMethod?: 'legacy' | 'orchestrator';
}

export class SubmissionService {
  /**
   * Create a new file submission
   */
  async createSubmission(
    userId: string,
    fileIds: string[],
    accessToken: string
  ): Promise<FileSubmission> {
    // Get file metadata from OneDrive
    const files = await oneDriveService.getFilesMetadata(accessToken, fileIds);

    const submission: FileSubmission = {
      id: uuidv4(),
      userId,
      files,
      status: 'pending',
      submittedAt: new Date(),
    };

    submissions.set(submission.id, submission);
    return submission;
  }

  /**
   * Process a submission with the given classification configuration
   */
  async processSubmission(
    submissionId: string,
    accessToken: string,
    classificationConfig: ClassificationConfig
  ): Promise<FileSubmission> {
    const submission = submissions.get(submissionId);

    if (!submission) {
      throw new Error('Submission not found');
    }

    // Update status to processing
    submission.status = 'processing';
    submissions.set(submissionId, submission);

    try {
      const results: ClassificationResult[] = [];

      // Process each file
      for (const file of submission.files) {
        try {
          console.log(`Processing file: ${file.name}`);

          // Download file from OneDrive
          const fileBuffer = await oneDriveService.downloadFile(accessToken, file.id);

          // Extract text content
          const textContent = await fileProcessorService.extractTextContent(
            fileBuffer,
            file.mimeType,
            file.name
          );

          // Classify file using AI agent
          const classificationResult = await classificationAgentService.classifyFile(
            textContent,
            file.name,
            classificationConfig
          );

          results.push({
            ...classificationResult,
            fileId: file.id,
          });

          console.log(`Successfully processed file: ${file.name}`);
        } catch (error) {
          console.error(`Error processing file ${file.name}:`, error);
          results.push({
            fileId: file.id,
            fileName: file.name,
            classification: 'Error',
            extractedInfo: {},
            processedAt: new Date(),
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      }

      // Update submission with results
      submission.results = results;
      submission.status = 'completed';
      submission.completedAt = new Date();
      submissions.set(submissionId, submission);

      return submission;
    } catch (error) {
      console.error('Error processing submission:', error);
      submission.status = 'failed';
      submissions.set(submissionId, submission);
      throw error;
    }
  }

  /**
   * Get submission by ID
   */
  getSubmission(submissionId: string): FileSubmission | undefined {
    return submissions.get(submissionId);
  }

  /**
   * Get all submissions for a user
   */
  getUserSubmissions(userId: string): FileSubmission[] {
    return Array.from(submissions.values()).filter((s) => s.userId === userId);
  }

  /**
   * Delete a submission
   */
  deleteSubmission(submissionId: string): boolean {
    return submissions.delete(submissionId);
  }

  /**
   * Process a folder from OneDrive with the new orchestrator agent system
   */
  async processFolderWithOrchestrator(
    userId: string,
    folderId: string,
    accessToken: string
  ): Promise<ExtendedFileSubmission> {
    const submissionId = uuidv4();

    // Create initial submission
    const submission: ExtendedFileSubmission = {
      id: submissionId,
      userId,
      files: [],
      status: 'processing',
      submittedAt: new Date(),
      processingMethod: 'orchestrator',
    };

    submissions.set(submissionId, submission);

    try {
      console.log(`Processing folder ${folderId} with orchestrator agent...`);

      // Process folder with the new document processor
      const result = await documentProcessorService.processFolderFromOneDrive(
        accessToken,
        folderId
      );

      // Update submission with results
      submission.processingResults = result.results;
      submission.excelBuffer = result.excelBuffer;
      submission.status = 'completed';
      submission.completedAt = new Date();

      // Also populate the legacy results field for compatibility
      submission.results = result.results.map((r) => ({
        fileId: r.fileId,
        fileName: r.fileName,
        classification: r.documentType,
        extractedInfo: r.extractedData,
        confidence: r.classificationConfidence,
        processedAt: new Date(),
        error: r.error,
      }));

      submissions.set(submissionId, submission);

      console.log(
        `Folder processing completed. ${result.summary.processedFiles}/${result.summary.totalFiles} files processed successfully.`
      );

      return submission;
    } catch (error) {
      console.error('Error processing folder:', error);
      submission.status = 'failed';
      submissions.set(submissionId, submission);
      throw error;
    }
  }

  /**
   * Get Excel export for a submission
   */
  getExcelExport(submissionId: string): Buffer | undefined {
    const submission = submissions.get(submissionId) as ExtendedFileSubmission;
    return submission?.excelBuffer;
  }
}

export const submissionService = new SubmissionService();
