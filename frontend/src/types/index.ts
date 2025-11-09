export interface User {
  id: string;
  email: string;
  name: string;
}

export interface OneDriveFile {
  id: string;
  name: string;
  path: string;
  size: number;
  mimeType: string;
  downloadUrl?: string;
}

export interface FileSubmission {
  id: string;
  userId: string;
  files: OneDriveFile[];
  status: 'pending' | 'processing' | 'completed' | 'failed';
  submittedAt: string;
  completedAt?: string;
  results?: ClassificationResult[];
}

export interface ClassificationResult {
  fileId: string;
  fileName: string;
  classification: string;
  extractedInfo: Record<string, any>;
  confidence?: number;
  processedAt: string;
  error?: string;
}

export interface ClassificationConfig {
  prompt: string;
  categories?: string[];
  extractionFields?: string[];
  model?: string;
}

export interface PickerFile {
  id: string;
  name: string;
  size: number;
  mimeType: string;
}

export interface Expense {
  id: string;
  user: string;
  description: string;
  value: number;
  expenseDate: string;
  fileName: string;
  fileId?: string;
  state: 'recebida' | 'paga' | 'rejeitada';
  submittedAt: string;
}

export interface MonthlyExpenseReport {
  user: string;
  month: string;
  expenses: Expense[];
  total: number;
  countByState: {
    recebida: number;
    paga: number;
    rejeitada: number;
  };
}
