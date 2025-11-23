import { Component, input, output, OnInit, OnDestroy, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';

declare const docx: any;

@Component({
  selector: 'amital-word-viewer',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './amital-word-viewer.component.html',
  styleUrl: './amital-word-viewer.component.scss',
})
export class AmitalWordViewerComponent implements OnInit, AfterViewInit, OnDestroy {
  src = input<string | Blob>('');
  fileName = input<string>('');

  loadError = output<string>();

  @ViewChild('docxContainer') docxContainer!: ElementRef<HTMLDivElement>;

  isLoading = true;
  error = '';

  ngOnInit(): void {}

  ngAfterViewInit(): void {
    this.loadDocument();
  }

  private async loadDocument(): Promise<void> {
    const srcValue = this.src();
    if (!srcValue) {
      this.error = 'Document source is not provided';
      this.loadError.emit(this.error);
      this.isLoading = false;
      return;
    }

    try {
      let blob: Blob;

      if (typeof srcValue === 'string') {
        const response = await fetch(srcValue);
        blob = await response.blob();
      } else {
        blob = srcValue;
      }

      const arrayBuffer = await blob.arrayBuffer();

      if (typeof docx !== 'undefined' && docx.renderAsync) {
        await docx.renderAsync(arrayBuffer, this.docxContainer.nativeElement, undefined, {
          className: 'docx-wrapper',
          inWrapper: true,
          ignoreWidth: false,
          ignoreHeight: false,
          ignoreFonts: false,
          breakPages: true,
          ignoreLastRenderedPageBreak: true,
          experimental: false,
          trimXmlDeclaration: true,
          useBase64URL: true,
          renderHeaders: true,
          renderFooters: true,
          renderFootnotes: true,
          renderEndnotes: true,
        });
        this.isLoading = false;
      } else {
        throw new Error('docx-preview library not loaded');
      }
    } catch (err: any) {
      console.error('Error loading Word document:', err);
      this.error = `Failed to load document: ${err.message || 'Unknown error'}`;
      this.loadError.emit(this.error);
      this.isLoading = false;
    }
  }

  ngOnDestroy(): void {}
}
