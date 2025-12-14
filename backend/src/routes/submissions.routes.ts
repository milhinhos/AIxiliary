import { Router, Request, Response } from 'express';
import { submissionService } from '../services/submission.service';
import { requireAuth } from '../middleware/auth.middleware';
import { ClassificationConfig } from '../types';

const router = Router();

// Apply authentication middleware to all routes
router.use(requireAuth);

/**
 * POST /submissions
 * Create a new file submission
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const { fileIds } = req.body;

    if (!Array.isArray(fileIds) || fileIds.length === 0) {
      return res.status(400).json({ error: 'fileIds array is required' });
    }

    const userId = req.session.user!.id;
    const accessToken = req.session.user!.accessToken;

    const submission = await submissionService.createSubmission(userId, fileIds, accessToken);

    res.json({ submission });
  } catch (error) {
    console.error('Error creating submission:', error);
    res.status(500).json({ error: 'Failed to create submission' });
  }
});

/**
 * POST /submissions/:submissionId/process
 * Process a submission with classification
 */
router.post('/:submissionId/process', async (req: Request, res: Response) => {
  try {
    const { submissionId } = req.params;
    const { classificationConfig } = req.body as { classificationConfig: ClassificationConfig };

    if (!classificationConfig || !classificationConfig.prompt) {
      return res.status(400).json({
        error: 'classificationConfig with prompt is required',
      });
    }

    const accessToken = req.session.user!.accessToken;

    // Start processing asynchronously
    const submission = await submissionService.processSubmission(
      submissionId,
      accessToken,
      classificationConfig
    );

    res.json({ submission });
  } catch (error) {
    console.error('Error processing submission:', error);
    res.status(500).json({ error: 'Failed to process submission' });
  }
});

/**
 * GET /submissions/:submissionId
 * Get submission status and results
 */
router.get('/:submissionId', (req: Request, res: Response) => {
  try {
    const { submissionId } = req.params;

    const submission = submissionService.getSubmission(submissionId);

    if (!submission) {
      return res.status(404).json({ error: 'Submission not found' });
    }

    // Verify user owns this submission
    if (submission.userId !== req.session.user!.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json({ submission });
  } catch (error) {
    console.error('Error getting submission:', error);
    res.status(500).json({ error: 'Failed to get submission' });
  }
});

/**
 * GET /submissions
 * Get all submissions for the current user
 */
router.get('/', (req: Request, res: Response) => {
  try {
    const userId = req.session.user!.id;

    const submissions = submissionService.getUserSubmissions(userId);

    res.json({ submissions });
  } catch (error) {
    console.error('Error getting submissions:', error);
    res.status(500).json({ error: 'Failed to get submissions' });
  }
});

/**
 * DELETE /submissions/:submissionId
 * Delete a submission
 */
router.delete('/:submissionId', (req: Request, res: Response) => {
  try {
    const { submissionId } = req.params;

    const submission = submissionService.getSubmission(submissionId);

    if (!submission) {
      return res.status(404).json({ error: 'Submission not found' });
    }

    // Verify user owns this submission
    if (submission.userId !== req.session.user!.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    submissionService.deleteSubmission(submissionId);

    res.json({ message: 'Submission deleted successfully' });
  } catch (error) {
    console.error('Error deleting submission:', error);
    res.status(500).json({ error: 'Failed to delete submission' });
  }
});

/**
 * POST /submissions/process-folder
 * Process an entire OneDrive folder with the orchestrator agent system
 * This is the main endpoint for credit application processing
 */
router.post('/process-folder', async (req: Request, res: Response) => {
  try {
    const { folderId } = req.body;

    if (!folderId) {
      return res.status(400).json({ error: 'folderId is required' });
    }

    const userId = req.session.user!.id;
    const accessToken = req.session.user!.accessToken;

    console.log(`Processing folder ${folderId} for user ${userId}`);

    const submission = await submissionService.processFolderWithOrchestrator(
      userId,
      folderId,
      accessToken
    );

    res.json({
      submission: {
        id: submission.id,
        status: submission.status,
        submittedAt: submission.submittedAt,
        completedAt: submission.completedAt,
        results: submission.processingResults,
        hasExcelExport: !!submission.excelBuffer,
      },
    });
  } catch (error) {
    console.error('Error processing folder:', error);
    res.status(500).json({
      error: 'Failed to process folder',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /submissions/:submissionId/export/excel
 * Download Excel export for a submission
 */
router.get('/:submissionId/export/excel', (req: Request, res: Response) => {
  try {
    const { submissionId } = req.params;

    const submission = submissionService.getSubmission(submissionId);

    if (!submission) {
      return res.status(404).json({ error: 'Submission not found' });
    }

    // Verify user owns this submission
    if (submission.userId !== req.session.user!.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const excelBuffer = submissionService.getExcelExport(submissionId);

    if (!excelBuffer) {
      return res.status(404).json({ error: 'Excel export not available for this submission' });
    }

    // Set headers for Excel download
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="credit-application-${submissionId}.xlsx"`
    );
    res.setHeader('Content-Length', excelBuffer.length);

    res.send(excelBuffer);
  } catch (error) {
    console.error('Error downloading Excel export:', error);
    res.status(500).json({ error: 'Failed to download Excel export' });
  }
});

/**
 * GET /submissions/:submissionId/export/json
 * Download JSON export for a submission
 */
router.get('/:submissionId/export/json', (req: Request, res: Response) => {
  try {
    const { submissionId } = req.params;

    const submission = submissionService.getSubmission(submissionId);

    if (!submission) {
      return res.status(404).json({ error: 'Submission not found' });
    }

    // Verify user owns this submission
    if (submission.userId !== req.session.user!.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (!submission.results || submission.results.length === 0) {
      return res.status(404).json({ error: 'No results available for this submission' });
    }

    // Set headers for JSON download
    res.setHeader('Content-Type', 'application/json');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="credit-application-${submissionId}.json"`
    );

    res.json({
      submissionId: submission.id,
      submittedAt: submission.submittedAt,
      completedAt: submission.completedAt,
      results: submission.results,
    });
  } catch (error) {
    console.error('Error downloading JSON export:', error);
    res.status(500).json({ error: 'Failed to download JSON export' });
  }
});

export default router;
