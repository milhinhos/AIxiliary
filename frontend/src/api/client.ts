import axios from 'axios';
import { User, FileSubmission, OneDriveFile, ClassificationConfig, Expense, MonthlyExpenseReport } from '../types';

const api = axios.create({
  baseURL: 'http://localhost:3001',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const authApi = {
  getAuthUrl: async (): Promise<string> => {
    const response = await api.get<{ authUrl: string }>('/auth/login');
    return response.data.authUrl;
  },

  getCurrentUser: async (): Promise<User> => {
    const response = await api.get<User>('/auth/user');
    return response.data;
  },

  logout: async (): Promise<void> => {
    await api.post('/auth/logout');
  },
};

export const filesApi = {
  listFiles: async (folderId?: string): Promise<OneDriveFile[]> => {
    const response = await api.get<{ files: OneDriveFile[] }>('/files', {
      params: { folderId },
    });
    return response.data.files;
  },

  getFile: async (fileId: string): Promise<OneDriveFile> => {
    const response = await api.get<{ file: OneDriveFile }>(`/files/${fileId}`);
    return response.data.file;
  },

  getFilesBatch: async (fileIds: string[]): Promise<OneDriveFile[]> => {
    const response = await api.post<{ files: OneDriveFile[] }>('/files/batch', {
      fileIds,
    });
    return response.data.files;
  },
};

export const submissionsApi = {
  createSubmission: async (fileIds: string[]): Promise<FileSubmission> => {
    const response = await api.post<{ submission: FileSubmission }>('/submissions', {
      fileIds,
    });
    return response.data.submission;
  },

  processSubmission: async (
    submissionId: string,
    classificationConfig: ClassificationConfig
  ): Promise<FileSubmission> => {
    const response = await api.post<{ submission: FileSubmission }>(
      `/submissions/${submissionId}/process`,
      { classificationConfig }
    );
    return response.data.submission;
  },

  getSubmission: async (submissionId: string): Promise<FileSubmission> => {
    const response = await api.get<{ submission: FileSubmission }>(
      `/submissions/${submissionId}`
    );
    return response.data.submission;
  },

  listSubmissions: async (): Promise<FileSubmission[]> => {
    const response = await api.get<{ submissions: FileSubmission[] }>('/submissions');
    return response.data.submissions;
  },

  deleteSubmission: async (submissionId: string): Promise<void> => {
    await api.delete(`/submissions/${submissionId}`);
  },
};

export const expenseApi = {
  submitExpense: async (
    user: string,
    description: string,
    value: number,
    expenseDate: string,
    file: File
  ): Promise<Expense> => {
    const formData = new FormData();
    formData.append('user', user);
    formData.append('description', description);
    formData.append('value', value.toString());
    formData.append('expenseDate', expenseDate);
    formData.append('file', file);

    const response = await api.post<Expense>('/api/expenses', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  getUserExpenses: async (user: string): Promise<Expense[]> => {
    const response = await api.get<Expense[]>(`/api/expenses/user/${user}`);
    return response.data;
  },

  getMonthlyReport: async (
    user: string,
    year: number,
    month: number
  ): Promise<MonthlyExpenseReport> => {
    const response = await api.get<MonthlyExpenseReport>(
      `/api/expenses/report/${user}/${year}/${month}`
    );
    return response.data;
  },

  updateExpenseState: async (
    user: string,
    expenseId: string,
    state: 'recebida' | 'paga' | 'rejeitada'
  ): Promise<Expense> => {
    const response = await api.patch<Expense>(
      `/api/expenses/${user}/${expenseId}/state`,
      { state }
    );
    return response.data;
  },

  getExpenseFileUrl: async (user: string, expenseId: string): Promise<string> => {
    const response = await api.get<{ downloadUrl: string }>(
      `/api/expenses/${user}/${expenseId}/file`
    );
    return response.data.downloadUrl;
  },
};

export default api;
