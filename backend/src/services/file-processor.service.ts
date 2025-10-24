import pdf from 'pdf-parse';
import mammoth from 'mammoth';

export class FileProcessorService {
  /**
   * Extract text content from a file based on its MIME type
   */
  async extractTextContent(buffer: Buffer, mimeType: string, fileName: string): Promise<string> {
    try {
      // PDF files
      if (mimeType === 'application/pdf' || fileName.endsWith('.pdf')) {
        return await this.extractPdfText(buffer);
      }

      // Word documents
      if (
        mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
        fileName.endsWith('.docx')
      ) {
        return await this.extractDocxText(buffer);
      }

      // Plain text files
      if (
        mimeType === 'text/plain' ||
        mimeType === 'text/markdown' ||
        fileName.endsWith('.txt') ||
        fileName.endsWith('.md')
      ) {
        return buffer.toString('utf-8');
      }

      // JSON files
      if (mimeType === 'application/json' || fileName.endsWith('.json')) {
        return buffer.toString('utf-8');
      }

      // CSV files
      if (mimeType === 'text/csv' || fileName.endsWith('.csv')) {
        return buffer.toString('utf-8');
      }

      // XML files
      if (mimeType === 'application/xml' || mimeType === 'text/xml' || fileName.endsWith('.xml')) {
        return buffer.toString('utf-8');
      }

      // HTML files
      if (mimeType === 'text/html' || fileName.endsWith('.html')) {
        return buffer.toString('utf-8');
      }

      // For unsupported types, try to read as text
      console.warn(`Unsupported file type: ${mimeType}. Attempting to read as text.`);
      return buffer.toString('utf-8');
    } catch (error) {
      console.error(`Error extracting text from file ${fileName}:`, error);
      throw new Error(`Failed to extract text from file: ${error}`);
    }
  }

  /**
   * Extract text from PDF file
   */
  private async extractPdfText(buffer: Buffer): Promise<string> {
    try {
      const data = await pdf(buffer);
      return data.text;
    } catch (error) {
      console.error('Error parsing PDF:', error);
      throw new Error('Failed to parse PDF file');
    }
  }

  /**
   * Extract text from DOCX file
   */
  private async extractDocxText(buffer: Buffer): Promise<string> {
    try {
      const result = await mammoth.extractRawText({ buffer });
      return result.value;
    } catch (error) {
      console.error('Error parsing DOCX:', error);
      throw new Error('Failed to parse DOCX file');
    }
  }

  /**
   * Get file metadata summary
   */
  getFileInfo(buffer: Buffer, fileName: string, mimeType: string) {
    return {
      fileName,
      mimeType,
      size: buffer.length,
      sizeReadable: this.formatBytes(buffer.length),
    };
  }

  /**
   * Format bytes to readable string
   */
  private formatBytes(bytes: number, decimals: number = 2): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];

    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  }
}

export const fileProcessorService = new FileProcessorService();
