import { Router, Request, Response } from 'express';
import multer from 'multer';
import { expenseService } from '../services/expense.service';

const router = Router();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Only allow jpg, jpeg, and pdf files
    const allowedMimes = ['image/jpeg', 'image/jpg', 'application/pdf'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only JPG and PDF files are allowed'));
    }
  },
});

/**
 * Helper to get access token from session
 */
const getAccessToken = (req: Request): string | null => {
  return req.session.user?.accessToken || null;
};

/**
 * POST /api/expenses
 * Submit a new expense
 */
router.post('/', upload.single('file'), async (req: Request, res: Response) => {
  try {
    const accessToken = getAccessToken(req);
    if (!accessToken) {
      return res.status(401).json({
        error: 'Authentication required. Please login with Microsoft first.'
      });
    }

    const { user, description, value, expenseDate } = req.body;
    const file = req.file;

    // Validate required fields
    if (!user || !description || !value || !expenseDate || !file) {
      return res.status(400).json({
        error: 'Missing required fields: user, description, value, expenseDate, file'
      });
    }

    // Validate user (only allow specific users)
    const allowedUsers = ['User1', 'User2', 'User3'];
    if (!allowedUsers.includes(user)) {
      return res.status(400).json({
        error: 'Invalid user. Allowed users: User1, User2, User3'
      });
    }

    // Validate value is a positive number
    const numValue = parseFloat(value);
    if (isNaN(numValue) || numValue <= 0) {
      return res.status(400).json({
        error: 'Value must be a positive number'
      });
    }

    // Validate date format
    const date = new Date(expenseDate);
    if (isNaN(date.getTime())) {
      return res.status(400).json({
        error: 'Invalid date format. Use YYYY-MM-DD'
      });
    }

    const expense = await expenseService.createExpense(
      accessToken,
      user,
      description,
      numValue,
      expenseDate,
      file
    );

    res.status(201).json(expense);
  } catch (error) {
    console.error('Error creating expense:', error);
    res.status(500).json({
      error: 'Failed to create expense',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/expenses/user/:user
 * Get all expenses for a user
 */
router.get('/user/:user', async (req: Request, res: Response) => {
  try {
    const accessToken = getAccessToken(req);
    if (!accessToken) {
      return res.status(401).json({
        error: 'Authentication required. Please login with Microsoft first.'
      });
    }

    const { user } = req.params;

    const expenses = await expenseService.getAllExpensesByUser(accessToken, user);
    res.json(expenses);
  } catch (error) {
    console.error('Error getting expenses:', error);
    res.status(500).json({
      error: 'Failed to retrieve expenses',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/expenses/report/:user/:year/:month
 * Get monthly expense report for a user
 */
router.get('/report/:user/:year/:month', async (req: Request, res: Response) => {
  try {
    const accessToken = getAccessToken(req);
    if (!accessToken) {
      return res.status(401).json({
        error: 'Authentication required. Please login with Microsoft first.'
      });
    }

    const { user, year, month } = req.params;

    // Validate year and month
    const yearNum = parseInt(year);
    const monthNum = parseInt(month);

    if (isNaN(yearNum) || yearNum < 2000 || yearNum > 2100) {
      return res.status(400).json({ error: 'Invalid year' });
    }

    if (isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
      return res.status(400).json({ error: 'Invalid month. Use 1-12' });
    }

    const monthStr = monthNum.toString().padStart(2, '0');

    const report = await expenseService.getMonthlyReport(
      accessToken,
      user,
      year,
      monthStr
    );

    res.json(report);
  } catch (error) {
    console.error('Error getting monthly report:', error);
    res.status(500).json({
      error: 'Failed to retrieve monthly report',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * PATCH /api/expenses/:user/:id/state
 * Update expense state
 */
router.patch('/:user/:id/state', async (req: Request, res: Response) => {
  try {
    const accessToken = getAccessToken(req);
    if (!accessToken) {
      return res.status(401).json({
        error: 'Authentication required. Please login with Microsoft first.'
      });
    }

    const { user, id } = req.params;
    const { state } = req.body;

    // Validate state
    const validStates = ['recebida', 'paga', 'rejeitada'];
    if (!state || !validStates.includes(state)) {
      return res.status(400).json({
        error: 'Invalid state. Must be: recebida, paga, or rejeitada'
      });
    }

    const expense = await expenseService.updateExpenseState(
      accessToken,
      user,
      id,
      state
    );

    if (!expense) {
      return res.status(404).json({ error: 'Expense not found' });
    }

    res.json(expense);
  } catch (error) {
    console.error('Error updating expense state:', error);
    res.status(500).json({
      error: 'Failed to update expense state',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/expenses/:user/:id/file
 * Get expense file download URL
 */
router.get('/:user/:id/file', async (req: Request, res: Response) => {
  try {
    const accessToken = getAccessToken(req);
    if (!accessToken) {
      return res.status(401).json({
        error: 'Authentication required. Please login with Microsoft first.'
      });
    }

    const { user, id } = req.params;

    const downloadUrl = await expenseService.getExpenseFileUrl(
      accessToken,
      user,
      id
    );

    if (!downloadUrl) {
      return res.status(404).json({ error: 'Expense file not found' });
    }

    res.json({ downloadUrl });
  } catch (error) {
    console.error('Error getting expense file URL:', error);
    res.status(500).json({
      error: 'Failed to retrieve expense file',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
