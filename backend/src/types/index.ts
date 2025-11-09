export interface FileSubmission {
  id: string;
  userId: string;
  files: OneDriveFile[];
  status: 'pending' | 'processing' | 'completed' | 'failed';
  submittedAt: Date;
  completedAt?: Date;
  results?: ClassificationResult[];
}

export interface OneDriveFile {
  id: string;
  name: string;
  path: string;
  size: number;
  mimeType: string;
  downloadUrl?: string;
}

export interface ClassificationResult {
  fileId: string;
  fileName: string;
  classification: string;
  extractedInfo: Record<string, any>;
  confidence?: number;
  processedAt: Date;
  error?: string;
}

export interface ClassificationConfig {
  prompt: string;
  categories?: string[];
  extractionFields?: string[];
  model?: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  accessToken: string;
  refreshToken?: string;
}

export interface Expense {
  id: string;
  user: string;
  description: string;
  value: number;
  expenseDate: string; // ISO date string
  fileName: string;
  fileId?: string; // OneDrive file ID
  state: 'recebida' | 'paga' | 'rejeitada';
  submittedAt: string; // ISO datetime string
}

export interface ExpenseSubmissionRequest {
  user: string;
  description: string;
  value: number;
  expenseDate: string;
  file: Express.Multer.File;
}

export interface MonthlyExpenseReport {
  user: string;
  month: string; // YYYY-MM format
  expenses: Expense[];
  total: number;
  countByState: {
    recebida: number;
    paga: number;
    rejeitada: number;
  };
}

declare module 'express-session' {
  interface SessionData {
    user?: User;
  }
}
