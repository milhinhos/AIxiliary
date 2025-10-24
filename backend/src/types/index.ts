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

declare module 'express-session' {
  interface SessionData {
    user?: User;
  }
}
