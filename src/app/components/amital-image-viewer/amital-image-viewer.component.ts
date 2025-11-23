import { Component, input, output, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'amital-image-viewer',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './amital-image-viewer.component.html',
  styleUrl: './amital-image-viewer.component.scss',
})
export class AmitalImageViewerComponent implements OnInit, OnDestroy {
  src = input<string | Blob>('');
  fileName = input<string>('');

  loadError = output<string>();

  imageSrc = '';
  isLoading = true;
  error = '';

  ngOnInit(): void {
    this.processSource();
  }

  private processSource(): void {
    const srcValue = this.src();
    if (!srcValue) {
      this.error = 'Image source is not provided';
      this.loadError.emit(this.error);
      this.isLoading = false;
      return;
    }

    if (typeof srcValue === 'string') {
      this.imageSrc = srcValue;
    } else {
      this.imageSrc = URL.createObjectURL(srcValue);
    }

    this.isLoading = false;
  }

  onImageLoad(): void {
    this.isLoading = false;
  }

  onImageError(): void {
    this.error = 'Failed to load image';
    this.loadError.emit(this.error);
    this.isLoading = false;
  }

  ngOnDestroy(): void {
    const srcValue = this.src();
    if (srcValue instanceof Blob && this.imageSrc.startsWith('blob:')) {
      URL.revokeObjectURL(this.imageSrc);
    }
  }
}
