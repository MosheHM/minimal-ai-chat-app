import { Component, input, output, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AmitalDocViewerToolbarComponent } from '../amital-doc-viewer-toolbar/amital-doc-viewer-toolbar.component';
import { AmitalSelectComponent } from '../amital-select/amital-select.component';
import * as XLSX from 'xlsx';

export interface ExcelSheetData {
  headers: string[];
  rows: any[][];
  totalRows: number;
  sheetName: string;
}

export interface ExcelData {
  sheets: ExcelSheetData[];
  currentSheetIndex: number;
  sheetNames: string[];
}

@Component({
  selector: 'amital-excel-viewer',
  imports: [CommonModule, FormsModule, AmitalDocViewerToolbarComponent, AmitalSelectComponent],
  templateUrl: './amital-excel-viewer.component.html',
  styleUrl: './amital-excel-viewer.component.scss',
})
export class AmitalExcelViewerComponent implements OnInit, OnDestroy {
  src = input.required<string | Blob | File>();
  fileName = input<string>('');
  showToolbar = input<boolean>(true);
  allowDownload = input<boolean>(true);
  allowZoom = input<boolean>(true);
  rowsPerPage = input<number>(50);
  showPagination = input<boolean>(true);

  loadError = output<string>();
  fileLoaded = output<ExcelData>();

  excelData: ExcelData | null = null;
  currentSheetData: ExcelSheetData | null = null;
  displayData: any[][] = [];
  isLoading = false;
  hasError = false;
  errorMessage = '';

  currentSheetIndex = 0;
  totalSheets = 1;
  sheetOptions: Array<{ index: number; name: string }> = [];

  get selectedSheetIndex(): number {
    return this.currentSheetIndex;
  }

  set selectedSheetIndex(value: number) {
    if (value !== this.currentSheetIndex) {
      this.goToSheet(value);
    }
  }

  currentPage = 1;
  totalPages = 1;
  currentRowsPerPage = 50;
  startRow = 0;
  endRow = 0;

  documentSrc = '';

  constructor(private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.currentRowsPerPage = this.rowsPerPage();
    this.processSrc();
  }

  ngOnDestroy(): void {
    this.cleanup();
  }

  private processSrc(): void {
    const srcValue = this.src();
    if (!srcValue) {
      this.handleError(new Error('No source provided. Please provide a valid URL or file.'));
      return;
    }

    if (typeof srcValue === 'string') {
      this.loadFromUrl(srcValue);
    } else if (srcValue instanceof Blob) {
      this.loadFromFile(srcValue);
    }
  }

  private async loadFromUrl(url: string): Promise<void> {
    this.isLoading = true;
    this.hasError = false;
    this.errorMessage = '';

    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch file: ${response.status} ${response.statusText}`);
      }

      const blob = await response.blob();
      await this.parseExcelFile(blob);
      this.documentSrc = url;
    } catch (error) {
      this.handleError(error);
    } finally {
      this.isLoading = false;
      this.cdr.detectChanges();
    }
  }

  async loadFromBlob(blob: Blob): Promise<void> {
    return this.loadFromFile(blob);
  }

  private async loadFromFile(file: Blob | File): Promise<void> {
    this.isLoading = true;
    this.hasError = false;
    this.errorMessage = '';

    try {
      await this.parseExcelFile(file);

      // Create object URL for download functionality
      if (this.documentSrc && this.documentSrc.startsWith('blob:')) {
        URL.revokeObjectURL(this.documentSrc);
      }
      this.documentSrc = URL.createObjectURL(file);

      // Set filename if it's a File object
      if (file instanceof File && !this.fileName()) {
        // Note: Can't directly set signal value, parent should handle this
      }
    } catch (error) {
      this.handleError(error);
    } finally {
      this.isLoading = false;
      this.cdr.detectChanges();
    }
  }

  private async parseExcelFile(file: Blob): Promise<void> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });

          if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
            throw new Error('No sheets found in the Excel file');
          }

          // Process all sheets
          const sheets: ExcelSheetData[] = [];

          for (const sheetName of workbook.SheetNames) {
            const worksheet = workbook.Sheets[sheetName];

            if (!worksheet) {
              console.warn(`Unable to read sheet: ${sheetName}`);
              continue;
            }

            // Convert sheet to JSON with header option
            const jsonData = XLSX.utils.sheet_to_json(worksheet, {
              header: 1,
              defval: '',
              blankrows: false,
            }) as any[][];

            if (jsonData.length === 0) {
              console.warn(`Sheet ${sheetName} appears to be empty`);
              continue;
            }

            // Extract headers (first row) and data rows
            const headers = jsonData[0]?.map((cell) => String(cell || '')) || [];
            const rows = jsonData.slice(1);

            sheets.push({
              headers,
              rows,
              totalRows: rows.length,
              sheetName,
            });
          }

          if (sheets.length === 0) {
            throw new Error('No readable sheets found in the Excel file');
          }

          this.excelData = {
            sheets,
            currentSheetIndex: 0,
            sheetNames: workbook.SheetNames,
          };

          this.totalSheets = sheets.length;
          this.currentSheetIndex = 0;
          this.currentSheetData = sheets[0];

          // Create options for the select component
          this.sheetOptions = workbook.SheetNames.map((name, index) => ({
            index,
            name,
          }));

          this.setupPagination();
          this.updateDisplayData();
          this.fileLoaded.emit(this.excelData);

          resolve();
        } catch (error) {
          reject(error);
        }
      };

      reader.onerror = () => {
        reject(new Error('Failed to read the file'));
      };

      reader.readAsArrayBuffer(file);
    });
  }

  private setupPagination(): void {
    if (!this.currentSheetData || !this.showPagination()) {
      this.totalPages = 1;
      this.currentPage = 1;
      return;
    }

    this.totalPages = Math.ceil(this.currentSheetData.totalRows / this.currentRowsPerPage);
    this.currentPage = 1;
  }

  private updateDisplayData(): void {
    if (!this.currentSheetData) {
      this.displayData = [];
      return;
    }

    if (!this.showPagination()) {
      this.displayData = this.currentSheetData.rows;
      this.startRow = 1;
      this.endRow = this.currentSheetData.totalRows;
    } else {
      const startIndex = (this.currentPage - 1) * this.currentRowsPerPage;
      const endIndex = Math.min(startIndex + this.currentRowsPerPage, this.currentSheetData.totalRows);

      this.displayData = this.currentSheetData.rows.slice(startIndex, endIndex);
      this.startRow = startIndex + 1;
      this.endRow = endIndex;
    }
  }

  private handleError(error: any): void {
    this.hasError = true;

    let message = 'Unknown error occurred';
    if (error instanceof Error) {
      if (error.message.includes('Failed to fetch')) {
        message = 'Unable to load file. Please check the URL or provide a valid file.';
      } else if (error.message.includes('CORS')) {
        message = 'Cross-origin request blocked. Please provide a valid file or ensure proper CORS headers.';
      } else if (error.message.includes('No sheets found') || error.message.includes('Unable to read')) {
        message = 'Invalid Excel file format. Please ensure the file is a valid Excel file (.xlsx or .xls).';
      } else if (error.message.includes('appears to be empty')) {
        message = 'The Excel file appears to be empty or contains no data.';
      } else {
        message = error.message;
      }
    }

    this.errorMessage = message;
    this.loadError.emit(message);
    console.error('Excel viewer error:', error);
  }

  private cleanup(): void {
    if (this.documentSrc && this.documentSrc.startsWith('blob:')) {
      URL.revokeObjectURL(this.documentSrc);
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.updateDisplayData();
      this.cdr.detectChanges();
    }
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.updateDisplayData();
      this.cdr.detectChanges();
    }
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.updateDisplayData();
      this.cdr.detectChanges();
    }
  }

  nextSheet(): void {
    if (this.currentSheetIndex < this.totalSheets - 1) {
      this.currentSheetIndex++;
      this.switchToSheet(this.currentSheetIndex);
    }
  }

  previousSheet(): void {
    if (this.currentSheetIndex > 0) {
      this.currentSheetIndex--;
      this.switchToSheet(this.currentSheetIndex);
    }
  }

  goToSheet(sheetIndex: number): void {
    if (sheetIndex >= 0 && sheetIndex < this.totalSheets) {
      this.currentSheetIndex = sheetIndex;
      this.switchToSheet(sheetIndex);
    }
  }

  private switchToSheet(sheetIndex: number): void {
    if (!this.excelData || !this.excelData.sheets[sheetIndex]) return;

    this.currentSheetData = this.excelData.sheets[sheetIndex];
    this.currentPage = 1;
    this.setupPagination();
    this.updateDisplayData();
    this.cdr.detectChanges();
  }

  canGoToPreviousSheet(): boolean {
    return this.currentSheetIndex > 0;
  }

  canGoToNextSheet(): boolean {
    return this.currentSheetIndex < this.totalSheets - 1;
  }

  downloadFile(): void {
    if (!this.allowDownload() || !this.documentSrc) return;

    const link = document.createElement('a');
    link.href = this.documentSrc;
    link.download = this.fileName() || this.getDefaultFileName();
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  private getDefaultFileName(): string {
    const srcValue = this.src();
    if (typeof srcValue === 'string') {
      return srcValue.split('/').pop() || 'spreadsheet.xlsx';
    }
    return 'spreadsheet.xlsx';
  }

  public loadFileFromUrl(_url: string): void {
    // This method is kept for backward compatibility but signals should be updated from parent
    console.warn('loadFileFromUrl: Signal inputs should be updated from parent component');
  }

  public loadFileFromFile(_file: File | Blob): void {
    // This method is kept for backward compatibility but signals should be updated from parent
    console.warn('loadFileFromFile: Signal inputs should be updated from parent component');
  }

  public reload(): void {
    this.processSrc();
  }

  public clearData(): void {
    this.excelData = null;
    this.displayData = [];
    this.currentPage = 1;
    this.totalPages = 1;
    this.hasError = false;
    this.errorMessage = '';
    this.cleanup();
  }

  getCellValue(value: any): string {
    if (value === null || value === undefined) {
      return '';
    }
    return String(value);
  }

  getDisplayRange(): string {
    if (!this.currentSheetData || !this.showPagination()) {
      return this.currentSheetData
        ? `1-${this.currentSheetData.totalRows} of ${this.currentSheetData.totalRows}`
        : '0-0 of 0';
    }
    return `${this.startRow}-${this.endRow} of ${this.currentSheetData.totalRows}`;
  }

  trackByIndex(index: number): number {
    return index;
  }

  getEmptyColumns(row: any[]): number[] {
    if (!this.currentSheetData) return [];
    const emptyCount = Math.max(0, this.currentSheetData.headers.length - row.length);
    return Array(emptyCount)
      .fill(0)
      .map((_, i) => i);
  }
}
