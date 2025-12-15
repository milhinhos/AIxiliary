import ExcelJS from 'exceljs';
import { ExtractionResult } from '../agents/specialized.agent';

export interface ExcelExportOptions {
  includeMetadata?: boolean;
  sheetName?: string;
  title?: string;
}

export class ExcelExportService {
  /**
   * Export extraction results to Excel buffer
   */
  async exportToExcel(
    results: Array<ExtractionResult & { fileName: string }>,
    options: ExcelExportOptions = {}
  ): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();

    // Set workbook properties
    workbook.creator = 'AIxiliary Credit Application Processor';
    workbook.created = new Date();
    workbook.modified = new Date();

    const sheetName = options.sheetName || 'Credit Application Data';
    const worksheet = workbook.addWorksheet(sheetName);

    // Add title row if specified
    if (options.title) {
      worksheet.mergeCells('A1:F1');
      const titleCell = worksheet.getCell('A1');
      titleCell.value = options.title;
      titleCell.font = { size: 16, bold: true };
      titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
      worksheet.getRow(1).height = 30;
    }

    // Collect all unique fields from all results
    const allFields = new Set<string>();
    results.forEach((result) => {
      Object.keys(result.extractedData).forEach((field) => allFields.add(field));
    });

    // Create header row
    const headerRow = options.title ? 2 : 1;
    const headers = [
      'File Name',
      'Document Type',
      'Confidence',
      ...Array.from(allFields),
      ...(options.includeMetadata ? ['Processing Status', 'Error Message'] : []),
    ];

    const headerRowObj = worksheet.getRow(headerRow);
    headerRowObj.values = headers;
    headerRowObj.font = { bold: true };
    headerRowObj.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4472C4' },
    };
    headerRowObj.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerRowObj.alignment = { horizontal: 'center', vertical: 'middle' };
    headerRowObj.height = 20;

    // Add data rows
    results.forEach((result, index) => {
      const rowData: any[] = [
        result.fileName,
        this.formatDocumentType(result.documentType),
        result.confidence ? (result.confidence * 100).toFixed(1) + '%' : 'N/A',
      ];

      // Add extracted data fields
      Array.from(allFields).forEach((field) => {
        const value = result.extractedData[field];
        rowData.push(this.formatCellValue(value));
      });

      // Add metadata if requested
      if (options.includeMetadata) {
        rowData.push(result.error ? 'Error' : 'Success');
        rowData.push(result.error || '');
      }

      const row = worksheet.addRow(rowData);

      // Color code rows based on document type
      const rowColor = this.getDocumentTypeColor(result.documentType);
      row.eachCell({ includeEmpty: false }, (cell, colNumber) => {
        if (colNumber > 3) {
          // Only data cells, not header cells
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: rowColor },
          };
        }
      });

      // Add borders
      row.eachCell({ includeEmpty: true }, (cell) => {
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' },
        };
      });
    });

    // Auto-fit columns
    if (worksheet.columns) {
      worksheet.columns.forEach((column) => {
        if (!column) return;
        let maxLength = 0;
        column.eachCell?.({ includeEmpty: true }, (cell) => {
          const cellValue = cell.value ? cell.value.toString() : '';
          maxLength = Math.max(maxLength, cellValue.length);
        });
        column.width = Math.min(Math.max(maxLength + 2, 12), 50);
      });
    }

    // Freeze header row
    worksheet.views = [
      {
        state: 'frozen',
        xSplit: 0,
        ySplit: headerRow,
        topLeftCell: `A${headerRow + 1}`,
        activeCell: `A${headerRow + 1}`,
      },
    ];

    // Generate buffer
    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer as ArrayBuffer);
  }

  /**
   * Export to JSON format (alternative to Excel)
   */
  exportToJSON(
    results: Array<ExtractionResult & { fileName: string }>
  ): string {
    const exportData = results.map((result) => ({
      fileName: result.fileName,
      documentType: result.documentType,
      confidence: result.confidence,
      data: result.extractedData,
      ...(result.error && { error: result.error }),
    }));

    return JSON.stringify(exportData, null, 2);
  }

  /**
   * Export to CSV format (tab-delimited)
   */
  exportToCSV(
    results: Array<ExtractionResult & { fileName: string }>,
    delimiter: string = '\t'
  ): string {
    if (results.length === 0) {
      return '';
    }

    // Collect all unique fields
    const allFields = new Set<string>();
    results.forEach((result) => {
      Object.keys(result.extractedData).forEach((field) => allFields.add(field));
    });

    // Create header row
    const headers = [
      'File Name',
      'Document Type',
      'Confidence',
      ...Array.from(allFields),
    ];

    const rows: string[] = [headers.join(delimiter)];

    // Add data rows
    results.forEach((result) => {
      const rowData: string[] = [
        this.escapeCsvValue(result.fileName),
        this.escapeCsvValue(this.formatDocumentType(result.documentType)),
        result.confidence ? (result.confidence * 100).toFixed(1) + '%' : 'N/A',
      ];

      Array.from(allFields).forEach((field) => {
        const value = result.extractedData[field];
        rowData.push(this.escapeCsvValue(this.formatCellValue(value)));
      });

      rows.push(rowData.join(delimiter));
    });

    return rows.join('\n');
  }

  /**
   * Format document type for display
   */
  private formatDocumentType(type: string): string {
    const typeMap: Record<string, string> = {
      'id-card': 'ID Card',
      'tax-declaration': 'Tax Declaration',
      'justice-declaration': 'Justice Declaration',
      'bank-authority': 'Bank Authority Declaration',
      'fin-process': 'FIN Process',
      'unknown': 'Unknown',
    };

    return typeMap[type] || type;
  }

  /**
   * Get color code for document type
   */
  private getDocumentTypeColor(type: string): string {
    const colorMap: Record<string, string> = {
      'id-card': 'FFE7F3FF',
      'tax-declaration': 'FFFEF2CB',
      'justice-declaration': 'FFD4EDDA',
      'bank-authority': 'FFDFE7FD',
      'fin-process': 'FFF8D7DA',
      'unknown': 'FFF0F0F0',
    };

    return colorMap[type] || 'FFFFFFFF';
  }

  /**
   * Format cell value for display
   */
  private formatCellValue(value: any): string {
    if (value === null || value === undefined) {
      return '';
    }

    if (typeof value === 'object') {
      return JSON.stringify(value);
    }

    return String(value);
  }

  /**
   * Escape CSV value
   */
  private escapeCsvValue(value: string): string {
    if (value.includes('\t') || value.includes('\n') || value.includes('"')) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  }

  /**
   * Create summary sheet with statistics
   */
  async exportWithSummary(
    results: Array<ExtractionResult & { fileName: string }>,
    options: ExcelExportOptions = {}
  ): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();

    workbook.creator = 'AIxiliary Credit Application Processor';
    workbook.created = new Date();
    workbook.modified = new Date();

    // Add summary sheet
    const summarySheet = workbook.addWorksheet('Summary');

    summarySheet.addRow(['Credit Application Processing Summary']);
    summarySheet.getCell('A1').font = { size: 16, bold: true };
    summarySheet.addRow([]);
    summarySheet.addRow(['Processing Date:', new Date().toLocaleString()]);
    summarySheet.addRow(['Total Files:', results.length]);
    summarySheet.addRow([]);

    // Document type breakdown
    summarySheet.addRow(['Document Type Breakdown:']);
    const typeCount: Record<string, number> = {};
    results.forEach((result) => {
      typeCount[result.documentType] = (typeCount[result.documentType] || 0) + 1;
    });

    Object.entries(typeCount).forEach(([type, count]) => {
      summarySheet.addRow([this.formatDocumentType(type), count]);
    });

    summarySheet.addRow([]);
    summarySheet.addRow(['Errors:', results.filter((r) => r.error).length]);

    // Auto-fit columns
    summarySheet.columns.forEach((column) => {
      column.width = 30;
    });

    // Add detailed data sheet
    const dataSheet = workbook.addWorksheet('Detailed Data');
    const allFields = new Set<string>();
    results.forEach((result) => {
      Object.keys(result.extractedData).forEach((field) => allFields.add(field));
    });

    const headers = ['File Name', 'Document Type', 'Confidence', ...Array.from(allFields)];
    const headerRow = dataSheet.addRow(headers);
    headerRow.font = { bold: true };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4472C4' },
    };
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };

    results.forEach((result) => {
      const rowData: any[] = [
        result.fileName,
        this.formatDocumentType(result.documentType),
        result.confidence ? (result.confidence * 100).toFixed(1) + '%' : 'N/A',
      ];

      Array.from(allFields).forEach((field) => {
        rowData.push(this.formatCellValue(result.extractedData[field]));
      });

      dataSheet.addRow(rowData);
    });

    if (dataSheet.columns) {
      dataSheet.columns.forEach((column) => {
        if (!column) return;
        let maxLength = 0;
        column.eachCell?.({ includeEmpty: true }, (cell) => {
          const cellValue = cell.value ? cell.value.toString() : '';
          maxLength = Math.max(maxLength, cellValue.length);
        });
        column.width = Math.min(Math.max(maxLength + 2, 12), 50);
      });
    }

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer as ArrayBuffer);
  }
}

export const excelExportService = new ExcelExportService();
