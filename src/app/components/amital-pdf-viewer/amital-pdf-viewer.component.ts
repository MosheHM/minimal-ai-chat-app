import { Component, input, output, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgxExtendedPdfViewerModule } from 'ngx-extended-pdf-viewer';
import { AmitalDocViewerToolbarComponent } from '../amital-doc-viewer-toolbar/amital-doc-viewer-toolbar.component';

@Component({
  selector: 'amital-pdf-viewer',
  imports: [CommonModule, FormsModule, NgxExtendedPdfViewerModule, AmitalDocViewerToolbarComponent],
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
  initialZoom = input<number>(50);

  loadError = output<string>();

  pdfSrc = '';
  currentPage = 1;
  totalPages = 0;
  currentRotation: 0 | 90 | 180 | 270 = 0;

  currentZoom = 50;
  minZoom = 50;
  maxZoom = 400;
  zoomStep = 25;

  ngOnInit(): void {
    this.currentZoom = this.initialZoom();
    this.processSrc();
    this.currentPage = this.startPage() || 1;
  }

  private normalizeRotation(rotation: number): 0 | 90 | 180 | 270 {
    const normalized = ((rotation % 360) + 360) % 360;
    switch (normalized) {
      case 0:
        return 0;
      case 90:
        return 90;
      case 180:
        return 180;
      case 270:
        return 270;
      default:
        return 0;
    }
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

  zoomIn(): void {
    if (typeof this.currentZoom === 'number') {
      const newZoom = this.currentZoom + this.zoomStep;
      if (newZoom <= this.maxZoom) {
        this.currentZoom = newZoom;
      }
    } else {
      this.currentZoom = 125;
    }
  }

  zoomOut(): void {
    if (typeof this.currentZoom === 'number') {
      const newZoom = this.currentZoom - this.zoomStep;
      if (newZoom >= this.minZoom) {
        this.currentZoom = newZoom;
      }
    } else {
      this.currentZoom = 75;
    }
  }

  canZoomIn(): boolean {
    if (typeof this.currentZoom === 'number') {
      return this.currentZoom < this.maxZoom;
    }
    return true;
  }

  canZoomOut(): boolean {
    if (typeof this.currentZoom === 'number') {
      return this.currentZoom > this.minZoom;
    }
    return true;
  }

  setZoom(zoom: number): void {
    this.currentZoom = zoom;
  }

  onZoomChange(zoomFactor: number): void {
    const percentage = Math.round(zoomFactor * 100);
    this.currentZoom = percentage;
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.goToPage(this.currentPage + 1);
    }
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.goToPage(this.currentPage - 1);
    }
  }

  rotateClockwise(): void {
    const newRotation = this.currentRotation + 90;
    this.currentRotation = this.normalizeRotation(newRotation);
  }

  rotateLeft(): void {
    const newRotation = this.currentRotation - 90;
    this.currentRotation = this.normalizeRotation(newRotation);
  }

  rotateRight(): void {
    const newRotation = this.currentRotation + 90;
    this.currentRotation = this.normalizeRotation(newRotation);
  }

  downloadPdf(): void {
    if (!this.allowDownload() || !this.pdfSrc) return;

    const link = document.createElement('a');
    link.href = this.pdfSrc;
    link.download = this.fileName() || 'document.pdf';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  ngOnDestroy(): void {
    // Clean up object URL if it was created from Blob
    const srcValue = this.src();
    if (srcValue instanceof Blob && this.pdfSrc.startsWith('blob:')) {
      URL.revokeObjectURL(this.pdfSrc);
    }
  }
}
