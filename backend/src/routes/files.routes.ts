import { Router, Request, Response } from 'express';
import { oneDriveService } from '../services/onedrive.service';
import { requireAuth } from '../middleware/auth.middleware';

const router = Router();

// Apply authentication middleware to all routes
router.use(requireAuth);

/**
 * GET /files
 * List files from OneDrive
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const { folderId } = req.query;
    const accessToken = req.session.user!.accessToken;

    const files = await oneDriveService.listFiles(
      accessToken,
      folderId as string | undefined
    );

    res.json({ files });
  } catch (error) {
    console.error('Error listing files:', error);
    res.status(500).json({ error: 'Failed to list files' });
  }
});

/**
 * GET /files/:fileId
 * Get file metadata
 */
router.get('/:fileId', async (req: Request, res: Response) => {
  try {
    const { fileId } = req.params;
    const accessToken = req.session.user!.accessToken;

    const file = await oneDriveService.getFileMetadata(accessToken, fileId);

    res.json({ file });
  } catch (error) {
    console.error('Error getting file metadata:', error);
    res.status(500).json({ error: 'Failed to get file metadata' });
  }
});

/**
 * POST /files/batch
 * Get metadata for multiple files
 */
router.post('/batch', async (req: Request, res: Response) => {
  try {
    const { fileIds } = req.body;

    if (!Array.isArray(fileIds)) {
      return res.status(400).json({ error: 'fileIds must be an array' });
    }

    const accessToken = req.session.user!.accessToken;

    const files = await oneDriveService.getFilesMetadata(accessToken, fileIds);

    res.json({ files });
  } catch (error) {
    console.error('Error getting files metadata:', error);
    res.status(500).json({ error: 'Failed to get files metadata' });
  }
});

export default router;
