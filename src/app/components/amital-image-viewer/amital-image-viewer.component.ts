import { Component, input, output, OnInit, OnDestroy, ViewChild, ElementRef, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AmitalDocViewerToolbarComponent } from '../amital-doc-viewer-toolbar/amital-doc-viewer-toolbar.component';

@Component({
  selector: 'amital-image-viewer',
  imports: [CommonModule, FormsModule, AmitalDocViewerToolbarComponent],
  templateUrl: './amital-image-viewer.component.html',
  styleUrl: './amital-image-viewer.component.scss',
})
export class AmitalImageViewerComponent implements OnInit, OnDestroy {
  src = input.required<string | Blob>();
  alt = input<string>('');
  fileName = input<string>('');
  showToolbar = input<boolean>(true);
  allowDownload = input<boolean>(true);
  allowRotation = input<boolean>(true);
  allowZoom = input<boolean>(true);
  initialZoom = input<number>(100);

  loadError = output<string>();
  imageLoaded = output<void>();

  @ViewChild('imageContainer', { static: false }) imageContainer!: ElementRef;
  @ViewChild('imageElement', { static: false }) imageElement!: ElementRef;

  imageSrc = '';
  currentZoom = 100;
  minZoom = 25;
  maxZoom = 500;
  zoomStep = 25;
  currentRotation: 0 | 90 | 180 | 270 = 0;

  isLoading = true;
  hasError = false;
  imageLoadedState = false;

  supportedFormats: string[] = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg', 'tiff', 'tif', 'ico', 'avif'];

  constructor(private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.currentZoom = this.initialZoom();
    this.processSrc();
  }

  ngOnDestroy(): void {
    // Clean up object URL if it was created from Blob
    const srcValue = this.src();
    if (srcValue instanceof Blob && this.imageSrc.startsWith('blob:')) {
      URL.revokeObjectURL(this.imageSrc);
    }
  }

  private processSrc(): void {
    const srcValue = this.src();
    if (!srcValue) {
      console.warn('Image source is not provided');
      this.loadError.emit('Image source is not provided');
      this.hasError = true;
      this.isLoading = false;
      return;
    }

    if (typeof srcValue === 'string') {
      this.imageSrc = srcValue;
      this.validateImageFormat();
    } else if (srcValue instanceof Blob) {
      // Convert Blob to URL
      this.imageSrc = URL.createObjectURL(srcValue);
    }
  }

  private validateImageFormat(): void {
    const extension = this.getFileExtension(this.imageSrc);
    if (!this.supportedFormats.includes(extension.toLowerCase())) {
      console.warn(`Potentially unsupported image format: ${extension}`);
    }
  }

  private getFileExtension(filename: string): string {
    return filename.split('.').pop()?.toLowerCase() || '';
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

  // Image event handlers
  onImageLoad(): void {
    this.isLoading = false;
    this.hasError = false;
    this.imageLoadedState = true;
    this.imageLoaded.emit();
    this.cdr.detectChanges();
  }

  onImageError(event: any): void {
    this.isLoading = false;
    this.hasError = true;
    this.imageLoadedState = false;
    console.error('Failed to load image', event);
    this.loadError.emit(`Failed to load image: ${event?.message || 'Unknown error'}`);
    this.cdr.detectChanges();
  }

  // Zoom methods (matching PDF viewer pattern)
  zoomIn(): void {
    if (!this.allowZoom()) return;

    const newZoom = this.currentZoom + this.zoomStep;
    if (newZoom <= this.maxZoom) {
      this.currentZoom = newZoom;
      this.applyTransform();
    }
  }

  zoomOut(): void {
    if (!this.allowZoom()) return;

    const newZoom = this.currentZoom - this.zoomStep;
    if (newZoom >= this.minZoom) {
      this.currentZoom = newZoom;
      this.applyTransform();
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
    this.applyTransform();
  }

  // Rotation methods (matching PDF viewer pattern)
  rotateClockwise(): void {
    if (!this.allowRotation()) return;

    const newRotation = this.currentRotation + 90;
    this.currentRotation = this.normalizeRotation(newRotation);
    this.applyTransform();
  }

  rotateLeft(): void {
    if (!this.allowRotation()) return;

    const newRotation = this.currentRotation - 90;
    this.currentRotation = this.normalizeRotation(newRotation);
    this.applyTransform();
  }

  rotateRight(): void {
    if (!this.allowRotation()) return;

    const newRotation = this.currentRotation + 90;
    this.currentRotation = this.normalizeRotation(newRotation);
    this.applyTransform();
  }

  // Transform application
  private applyTransform(): void {
    if (this.imageElement?.nativeElement) {
      const scaleValue = this.currentZoom / 100;
      this.imageElement.nativeElement.style.transform = `scale(${scaleValue}) rotate(${this.currentRotation}deg)`;
    }
  }

  // Download method (matching PDF viewer pattern)
  downloadImage(): void {
    if (!this.allowDownload() || !this.imageSrc) return;

    const link = document.createElement('a');
    link.href = this.imageSrc;
    link.download = this.fileName() || this.getDefaultFileName();
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  private getDefaultFileName(): string {
    const srcValue = this.src();
    if (typeof srcValue === 'string') {
      return srcValue.split('/').pop() || 'image';
    }
    return 'image';
  }

  // Fit methods for enhanced functionality
  fitToContainer(): void {
    if (!this.imageElement?.nativeElement || !this.imageContainer?.nativeElement) return;

    const container = this.imageContainer.nativeElement;
    const image = this.imageElement.nativeElement;

    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;
    const imageWidth = image.naturalWidth;
    const imageHeight = image.naturalHeight;

    const scaleX = containerWidth / imageWidth;
    const scaleY = containerHeight / imageHeight;
    const scale = Math.min(scaleX, scaleY);

    this.currentZoom = Math.round(scale * 100);
    this.applyTransform();
  }

  resetView(): void {
    this.currentZoom = 100;
    this.currentRotation = 0;
    this.applyTransform();
  }

  // Download method for toolbar
  downloadPdf(): void {
    this.downloadImage();
  }
}
