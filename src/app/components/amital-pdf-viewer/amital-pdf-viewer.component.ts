import { Component, input, output, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgxExtendedPdfViewerModule } from 'ngx-extended-pdf-viewer';

@Component({
  selector: 'amital-pdf-viewer',
  standalone: true,
  imports: [CommonModule, FormsModule, NgxExtendedPdfViewerModule],
  templateUrl: './amital-pdf-viewer.component.html',
  styleUrl: './amital-pdf-viewer.component.scss',
})
export class AmitalPdfViewerComponent implements OnInit, OnDestroy {
  src = input<string | Blob>('');
  startPage = input<number>(1);
  fileName = input<string>('');
  showToolbar = input<boolean>(false);
  allowDownload = input<boolean>(true);
  allowRotation = input<boolean>(true);
  allowZoom = input<boolean>(true);
  initialZoom = input<number>(100);

  loadError = output<string>();

  pdfSrc = '';
  currentPage = 1;
  totalPages = 0;
  currentRotation: 0 | 90 | 180 | 270 = 0;
  currentZoom = 100;

  ngOnInit(): void {
    this.currentZoom = this.initialZoom();
    this.processSrc();
    this.currentPage = this.startPage() || 1;
  }

  private processSrc(): void {
    const srcValue = this.src();
    if (!srcValue) {
      console.warn('PDF source is not provided');
      this.loadError.emit('PDF source is not provided');
      return;
    }

    if (typeof srcValue === 'string') {
      this.pdfSrc = srcValue;
    } else if (srcValue instanceof Blob) {
      this.pdfSrc = URL.createObjectURL(srcValue);
    }
  }

  onPdfLoaded(event: any): void {
    console.log('PDF loaded successfully', event);
    if (event && event.pagesCount) {
      this.totalPages = event.pagesCount;
    }
  }

  onPdfLoadingFailed(event: any): void {
    console.error('Failed to load PDF', event);
    this.loadError.emit(`Failed to load PDF: ${event?.message || 'Unknown error'}`);
  }

  onPageChange(event: any): void {
    if (event && typeof event === 'number') {
      this.currentPage = event;
    }
  }

  onZoomChange(zoomFactor: number): void {
    const percentage = Math.round(zoomFactor * 100);
    this.currentZoom = percentage;
  }

  ngOnDestroy(): void {
    const srcValue = this.src();
    if (srcValue instanceof Blob && this.pdfSrc.startsWith('blob:')) {
      URL.revokeObjectURL(this.pdfSrc);
    }
  }
}
