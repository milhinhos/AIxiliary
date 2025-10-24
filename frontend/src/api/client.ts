import axios from 'axios';
import { User, FileSubmission, OneDriveFile, ClassificationConfig } from '../types';

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

export default api;
