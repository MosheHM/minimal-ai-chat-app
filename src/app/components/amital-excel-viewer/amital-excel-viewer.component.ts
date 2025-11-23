import { Component, input, output, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import * as XLSX from 'xlsx';

@Component({
  selector: 'amital-excel-viewer',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './amital-excel-viewer.component.html',
  styleUrl: './amital-excel-viewer.component.scss',
})
export class AmitalExcelViewerComponent implements OnInit, OnDestroy {
  src = input<string | Blob>('');
  fileName = input<string>('');

  loadError = output<string>();

  isLoading = true;
  error = '';
  sheetNames: string[] = [];
  currentSheet = 0;
  tableData: string[][] = [];

  private workbook: XLSX.WorkBook | null = null;

  ngOnInit(): void {
    this.loadDocument();
  }

  private async loadDocument(): Promise<void> {
    const srcValue = this.src();
    if (!srcValue) {
      this.error = 'Excel source is not provided';
      this.loadError.emit(this.error);
      this.isLoading = false;
      return;
    }

    try {
      let arrayBuffer: ArrayBuffer;

      if (typeof srcValue === 'string') {
        const response = await fetch(srcValue);
        arrayBuffer = await response.arrayBuffer();
      } else {
        arrayBuffer = await srcValue.arrayBuffer();
      }

      this.workbook = XLSX.read(arrayBuffer, { type: 'array' });
      this.sheetNames = this.workbook.SheetNames;

      if (this.sheetNames.length > 0) {
        this.selectSheet(0);
      }

      this.isLoading = false;
    } catch (err: any) {
      console.error('Error loading Excel document:', err);
      this.error = `Failed to load document: ${err.message || 'Unknown error'}`;
      this.loadError.emit(this.error);
      this.isLoading = false;
    }
  }

  selectSheet(index: number): void {
    if (!this.workbook || index < 0 || index >= this.sheetNames.length) return;

    this.currentSheet = index;
    const sheetName = this.sheetNames[index];
    const worksheet = this.workbook.Sheets[sheetName];

    const jsonData = XLSX.utils.sheet_to_json<string[]>(worksheet, { header: 1 });
    this.tableData = jsonData as string[][];
  }

  ngOnDestroy(): void {
    this.workbook = null;
  }
}
