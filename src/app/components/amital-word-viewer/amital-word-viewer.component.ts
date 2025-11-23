import {
  Component,
  input,
  output,
  OnDestroy,
  AfterViewInit,
  ViewChild,
  ElementRef,
  ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AmitalDocViewerToolbarComponent } from '../amital-doc-viewer-toolbar/amital-doc-viewer-toolbar.component';
import * as docx from 'docx-preview';

@Component({
  selector: 'amital-word-viewer',
  imports: [CommonModule, FormsModule, AmitalDocViewerToolbarComponent],
  templateUrl: './amital-word-viewer.component.html',
  styleUrl: './amital-word-viewer.component.scss',
})
export class AmitalWordViewerComponent implements AfterViewInit, OnDestroy {
  src = input.required<string | Blob>();
  fileName = input<string>('');
  showToolbar = input<boolean>(true);
  allowDownload = input<boolean>(true);
  allowZoom = input<boolean>(true);

  loadError = output<string>();
  documentLoaded = output<void>();

  @ViewChild('docxContainer', { static: false }) docxContainer!: ElementRef<HTMLElement>;
  @ViewChild('documentWrapper', { static: false }) documentWrapper!: ElementRef<HTMLElement>;
  @ViewChild('wordViewerContainer', { static: false }) wordViewerContainer!: ElementRef<HTMLElement>;

  private resizeObserver?: ResizeObserver;
  private containerHeight = 600;

  currentZoom = 80;
  minZoom = 10;
  maxZoom = 300;
  zoomStep = 20;

  documentSrc = '';
  isLoading = true;
  hasError = false;
  documentLoadedState = false;

  constructor(
    private cdr: ChangeDetectorRef,
    private elementRef: ElementRef
  ) {}

  ngAfterViewInit(): void {
    this.setupResizeObserver();
    this.processSrc();
    this.setupZoomListeners();
  }

  ngOnDestroy(): void {
    this.clearContainer();
    this.removeZoomListeners();
    this.disconnectResizeObserver();
    const srcValue = this.src();
    if (srcValue instanceof Blob && this.documentSrc.startsWith('blob:')) {
      URL.revokeObjectURL(this.documentSrc);
    }
  }

  private setupZoomListeners(): void {
    if (this.documentWrapper?.nativeElement) {
      this.documentWrapper.nativeElement.addEventListener('wheel', this.handleWheelZoom.bind(this), { passive: false });
    }
  }

  private removeZoomListeners(): void {
    if (this.documentWrapper?.nativeElement) {
      this.documentWrapper.nativeElement.removeEventListener('wheel', this.handleWheelZoom.bind(this));
    }
  }

  private handleWheelZoom(event: WheelEvent): void {
    if (!this.allowZoom() || !event.ctrlKey) return;

    event.preventDefault();

    const zoomDirection = event.deltaY > 0 ? -1 : 1;
    const newZoom = this.currentZoom + zoomDirection * this.zoomStep;

    if (newZoom >= this.minZoom && newZoom <= this.maxZoom) {
      // Store the mouse position relative to the wrapper for focus-based zooming
      const wrapper = this.documentWrapper.nativeElement;
      const rect = wrapper.getBoundingClientRect();
      const mouseX = event.clientX - rect.left;
      const mouseY = event.clientY - rect.top;

      this.currentZoom = newZoom;
      this.applyZoomFromPoint(mouseX, mouseY);
    }
  }

  private setupResizeObserver(): void {
    if (!this.elementRef?.nativeElement) return;

    this.resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { height } = entry.contentRect;
        this.updateContainerHeight(height);
      }
    });

    this.resizeObserver.observe(this.elementRef.nativeElement);
  }

  private disconnectResizeObserver(): void {
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = undefined;
    }
  }

  private updateContainerHeight(height: number): void {
    // Calculate height accounting for toolbar if present
    const toolbarHeight = this.showToolbar() ? 60 : 0; // Approximate toolbar height
    const padding = 48; // Total padding (24px top + 24px bottom)
    this.containerHeight = Math.max(200, height - toolbarHeight - padding);

    // Update the document wrapper height if it exists
    if (this.documentWrapper?.nativeElement) {
      this.documentWrapper.nativeElement.style.height = `${this.containerHeight}px`;
    }
  }

  private applyInitialHeight(): void {
    if (this.elementRef?.nativeElement) {
      const containerRect = this.elementRef.nativeElement.getBoundingClientRect();
      if (containerRect.height > 0) {
        this.updateContainerHeight(containerRect.height);
      }
    }
  }

  private processSrc(): void {
    const srcValue = this.src();
    if (!srcValue || (typeof srcValue === 'string' && srcValue.trim() === '')) {
      console.warn('Word document source is not provided');
      this.loadError.emit('Word document source is not provided');
      this.hasError = true;
      this.isLoading = false;
      return;
    }

    if (typeof srcValue === 'string') {
      this.documentSrc = srcValue;
      this.loadDocument();
    } else if (srcValue instanceof Blob) {
      this.documentSrc = URL.createObjectURL(srcValue);
      this.loadDocument();
    }
  }

  private async loadDocument(): Promise<void> {
    this.isLoading = true;
    this.hasError = false;
    this.clearContainer();

    try {
      let documentData: Blob;
      const srcValue = this.src();

      if (srcValue instanceof Blob) {
        documentData = srcValue;
      } else if (typeof srcValue === 'string') {
        const response = await fetch(srcValue);
        if (!response.ok) {
          throw new Error(`Failed to fetch document: ${response.status} ${response.statusText}`);
        }
        documentData = await response.blob();
      } else {
        throw new Error('Invalid document source');
      }

      await this.validateDocumentFormat(documentData);

      const renderOptions = {
        className: 'docx',
        inWrapper: false,
        ignoreWidth: false,
        ignoreHeight: false,
        ignoreFonts: false,
        breakPages: false,
        renderHeaders: true,
        renderFooters: true,
        renderFootnotes: true,
        renderEndnotes: true,
        debug: false,
      };

      // Ensure the container element is available before rendering
      if (!this.docxContainer?.nativeElement) {
        throw new Error('Document container is not available');
      }

      await docx.renderAsync(documentData, this.docxContainer.nativeElement, undefined, renderOptions);

      this.isLoading = false;
      this.hasError = false;
      this.documentLoadedState = true;
      this.documentLoaded.emit();
      this.applyInitialHeight();
      this.applyTransform();
      this.cdr.detectChanges();
    } catch (error) {
      this.isLoading = false;
      this.hasError = true;
      this.documentLoadedState = false;
      console.error('Error loading DOCX document:', error);

      // Provide more user-friendly error messages
      let errorMessage = 'Unknown error occurred';
      if (error instanceof Error) {
        if (error.message.includes('Legacy .doc files are not supported')) {
          errorMessage = error.message;
        } else if (error.message.includes('Only .docx files are supported')) {
          errorMessage = error.message;
        } else if (error.message.includes('unexpected signature') || error.message.includes('Corrupted zip')) {
          errorMessage = 'Invalid document format. Please ensure the file is a valid Word document (.docx).';
        } else if (error.message.includes('Failed to fetch')) {
          errorMessage = 'Unable to load document. Please check the URL or try uploading a local file.';
        } else if (error.message.includes('CORS')) {
          errorMessage = 'Cross-origin request blocked. Try uploading a local file instead.';
        } else {
          errorMessage = error.message;
        }
      }

      this.loadError.emit(errorMessage);
      this.cdr.detectChanges();
    }
  }

  private clearContainer(): void {
    if (this.docxContainer?.nativeElement) {
      this.docxContainer.nativeElement.innerHTML = '';
    }
  }

  private async validateDocumentFormat(blob: Blob): Promise<void> {
    // Read the first few bytes to check file signature
    const firstBytes = await this.readFirstBytes(blob, 8);

    // Check for ZIP signature (DOCX files are ZIP archives)
    const zipSignature = [0x50, 0x4b, 0x03, 0x04]; // "PK\x03\x04"
    const isZip = zipSignature.every((byte, index) => firstBytes[index] === byte);

    // Check for legacy DOC signature
    const docSignature = [0xd0, 0xcf, 0x11, 0xe0]; // Legacy DOC file signature
    const isLegacyDoc = docSignature.every((byte, index) => firstBytes[index] === byte);

    // Check file name/URL for .doc extension if source is a string
    let hasDocExtension = false;
    const srcValue = this.src();
    if (typeof srcValue === 'string') {
      hasDocExtension = srcValue.toLowerCase().endsWith('.doc') && !srcValue.toLowerCase().endsWith('.docx');
    } else if (srcValue instanceof File) {
      hasDocExtension = srcValue.name.toLowerCase().endsWith('.doc') && !srcValue.name.toLowerCase().endsWith('.docx');
    }

    if (isLegacyDoc || (hasDocExtension && !isZip)) {
      throw new Error(
        'Legacy .doc files are not supported. Please convert the document to .docx format or use a different viewer.'
      );
    }

    if (!isZip) {
      throw new Error('Invalid document format. Only .docx files are supported.');
    }
  }

  private async readFirstBytes(blob: Blob, count: number): Promise<number[]> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const arrayBuffer = reader.result as ArrayBuffer;
        const uint8Array = new Uint8Array(arrayBuffer);
        const bytes = Array.from(uint8Array.slice(0, count));
        resolve(bytes);
      };
      reader.onerror = () => reject(reader.error);
      reader.readAsArrayBuffer(blob.slice(0, count));
    });
  }

  // Zoom methods (matching PDF/Image viewer pattern)
  zoomIn(): void {
    if (!this.allowZoom()) return;

    const newZoom = this.currentZoom + this.zoomStep;
    if (newZoom <= this.maxZoom) {
      this.currentZoom = newZoom;
      this.applyZoomFromFocus();
    }
  }

  zoomOut(): void {
    if (!this.allowZoom()) return;

    const newZoom = this.currentZoom - this.zoomStep;
    if (newZoom >= this.minZoom) {
      this.currentZoom = newZoom;
      this.applyZoomFromFocus();
    }
  }

  canZoomIn(): boolean {
    return this.allowZoom() && this.currentZoom < this.maxZoom;
  }

  canZoomOut(): boolean {
    return this.allowZoom() && this.currentZoom > this.minZoom;
  }

  setZoom(zoom: number): void {
    if (!this.allowZoom()) return;

    this.currentZoom = Math.max(this.minZoom, Math.min(this.maxZoom, zoom));
    this.applyZoomFromFocus();
  }

  // Transform application with focus-based zooming
  private applyZoomFromFocus(): void {
    if (!this.docxContainer?.nativeElement || !this.documentWrapper?.nativeElement) return;

    const wrapper = this.documentWrapper.nativeElement;

    // Use the center of the visible area as the focus point
    const focusX = wrapper.clientWidth / 2;
    const focusY = wrapper.clientHeight / 2;

    this.applyZoomFromPoint(focusX, focusY);
  }

  private applyZoomFromPoint(_focusX: number, _focusY: number): void {
    if (!this.docxContainer?.nativeElement || !this.documentWrapper?.nativeElement) return;

    const wrapper = this.documentWrapper.nativeElement;
    const container = this.docxContainer.nativeElement;

    // Apply the zoom transform with center origin for consistent centering
    const scaleValue = this.currentZoom / 100;
    container.style.transform = `scale(${scaleValue})`;
    container.style.transformOrigin = 'center top';

    // For zoom out, ensure the document stays centered
    if (scaleValue < 1) {
      // When zoomed out, the container will be smaller, so we need to ensure it's centered
      requestAnimationFrame(() => {
        const containerRect = container.getBoundingClientRect();
        const wrapperRect = wrapper.getBoundingClientRect();

        // Calculate the difference and center the document
        const horizontalDiff = wrapperRect.width - containerRect.width;
        if (horizontalDiff > 0) {
          wrapper.scrollLeft = Math.max(0, wrapper.scrollLeft - horizontalDiff / 2);
        }
      });
    }
  }

  // Legacy transform method for backward compatibility
  private applyTransform(): void {
    this.applyZoomFromFocus();
  }

  // Download method (matching PDF/Image viewer pattern)
  downloadPdf(): void {
    this.downloadDocument();
  }

  downloadDocument(): void {
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
      return srcValue.split('/').pop() || 'document.docx';
    }
    return 'document.docx';
  }

  // Utility methods
  resetView(): void {
    this.currentZoom = 100;
    this.applyTransform();
  }

  // Method to reload the document
  reload(): void {
    this.loadDocument();
  }

  // Public methods to load new documents - Note: These methods need to be called from parent to update input signals
  public loadDocumentFromUrl(_url: string): void {
    // This method is kept for backward compatibility but signals should be updated from parent
    console.warn('loadDocumentFromUrl: Signal inputs should be updated from parent component');
  }

  public loadDocumentFromFile(_file: File | Blob): void {
    // This method is kept for backward compatibility but signals should be updated from parent
    console.warn('loadDocumentFromFile: Signal inputs should be updated from parent component');
  }
}
