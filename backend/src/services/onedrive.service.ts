import { Client } from '@microsoft/microsoft-graph-client';
import axios from 'axios';
import { OneDriveFile } from '../types';

export class OneDriveService {
  private getClient(accessToken: string) {
    return Client.init({
      authProvider: (done) => {
        done(null, accessToken);
      },
    });
  }

  /**
   * Get user profile information
   */
  async getUserProfile(accessToken: string): Promise<any> {
    const client = this.getClient(accessToken);
    try {
      const user = await client.api('/me').get();
      return user;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      throw error;
    }
  }

  /**
   * Get file metadata from OneDrive
   */
  async getFileMetadata(accessToken: string, fileId: string): Promise<OneDriveFile> {
    const client = this.getClient(accessToken);
    try {
      const file = await client.api(`/me/drive/items/${fileId}`).get();

      return {
        id: file.id,
        name: file.name,
        path: file.parentReference?.path || '/',
        size: file.size,
        mimeType: file.file?.mimeType || 'application/octet-stream',
        downloadUrl: file['@microsoft.graph.downloadUrl'],
      };
    } catch (error) {
      console.error('Error fetching file metadata:', error);
      throw error;
    }
  }

  /**
   * Get multiple files metadata
   */
  async getFilesMetadata(accessToken: string, fileIds: string[]): Promise<OneDriveFile[]> {
    const files: OneDriveFile[] = [];

    for (const fileId of fileIds) {
      try {
        const file = await this.getFileMetadata(accessToken, fileId);
        files.push(file);
      } catch (error) {
        console.error(`Error fetching file ${fileId}:`, error);
        // Continue with other files
      }
    }

    return files;
  }

  /**
   * Download file content from OneDrive
   */
  async downloadFile(accessToken: string, fileId: string): Promise<Buffer> {
    const client = this.getClient(accessToken);
    try {
      // Get download URL
      const file = await client.api(`/me/drive/items/${fileId}`).get();
      const downloadUrl = file['@microsoft.graph.downloadUrl'];

      if (!downloadUrl) {
        throw new Error('Download URL not available for file');
      }

      // Download file content
      const response = await axios.get(downloadUrl, {
        responseType: 'arraybuffer',
      });

      return Buffer.from(response.data);
    } catch (error) {
      console.error('Error downloading file:', error);
      throw error;
    }
  }

  /**
   * List files in a folder
   */
  async listFiles(accessToken: string, folderId?: string): Promise<OneDriveFile[]> {
    const client = this.getClient(accessToken);
    try {
      const endpoint = folderId
        ? `/me/drive/items/${folderId}/children`
        : '/me/drive/root/children';

      const response = await client.api(endpoint).get();

      return response.value.map((item: any) => ({
        id: item.id,
        name: item.name,
        path: item.parentReference?.path || '/',
        size: item.size,
        mimeType: item.file?.mimeType || 'application/octet-stream',
        downloadUrl: item['@microsoft.graph.downloadUrl'],
      }));
    } catch (error) {
      console.error('Error listing files:', error);
      throw error;
    }
  }
}

export const oneDriveService = new OneDriveService();
