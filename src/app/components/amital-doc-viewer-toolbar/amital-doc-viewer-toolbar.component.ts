import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import {
  AmitalIconExportComponent,
  AmitalIconRotateComponent,
  AmitalIconZoomInComponent,
  AmitalIconZoomOutComponent,
} from '../../assets/icons/system';
import { AmitalButtonComponent } from '../amital-button/amital-button.component';
import { AmitalIconArrowLeftComponent } from '../../assets/icons/system/amital-icon-arrow-left.component';
import { AmitalIconArrowRightComponent } from '../../assets/icons/system/amital-icon-arrow-right.component';

@Component({
  selector: 'amital-doc-viewer-toolbar',
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    AmitalIconRotateComponent,
    AmitalButtonComponent,
    AmitalIconExportComponent,
    AmitalIconZoomInComponent,
    AmitalIconZoomOutComponent,
    AmitalIconArrowLeftComponent,
    AmitalIconArrowRightComponent,
  ],
  templateUrl: './amital-doc-viewer-toolbar.component.html',
  styleUrl: './amital-doc-viewer-toolbar.component.scss',
})
export class AmitalDocViewerToolbarComponent {
  @Input() currentPage = 0;
  @Input() totalPages = 1;
  @Input() currentZoom!: number;
  @Input() showPagination = true;
  @Input() showRotation = true;
  @Input() showZoom = true;

  @Input() currentSheet = 0;
  @Input() totalSheets = 1;
  @Input() sheetNames: string[] = [];
  @Input() showSheetNavigation = false;

  @Output() previousPage = new EventEmitter<void>();
  @Output() nextPage = new EventEmitter<void>();
  @Output() pageChange = new EventEmitter<number>();
  @Output() zoomIn = new EventEmitter<void>();
  @Output() zoomOut = new EventEmitter<void>();
  @Output() rotateClockwise = new EventEmitter<void>();
  @Output() download = new EventEmitter<void>();

  @Output() previousSheet = new EventEmitter<void>();
  @Output() nextSheet = new EventEmitter<void>();
  @Output() sheetChange = new EventEmitter<number>();

  minZoom = 50;
  maxZoom = 400;
  iconSize = 16;

  zoomStep = 10;

  onPreviousPage(): void {
    this.previousPage.emit();
  }

  onNextPage(): void {
    this.nextPage.emit();
  }

  onPageChange(page: number): void {
    this.pageChange.emit(page);
  }

  onZoomIn(): void {
    if (this.showZoom && this.canZoomIn()) this.zoomIn.emit();
  }

  onZoomOut(): void {
    if (this.showZoom && this.canZoomOut()) this.zoomOut.emit();
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

  // Rotation method
  onRotateClockwise(): void {
    this.rotateClockwise.emit();
  }

  // Download method
  onDownload(): void {
    this.download.emit();
  }

  // Helper methods
  canGoPrevious(): boolean {
    return this.currentPage > 1;
  }

  canGoNext(): boolean {
    return this.currentPage < this.totalPages;
  }

  // Sheet navigation methods
  onPreviousSheet(): void {
    this.previousSheet.emit();
  }

  onNextSheet(): void {
    this.nextSheet.emit();
  }

  onSheetChange(sheetIndex: number): void {
    this.sheetChange.emit(sheetIndex);
  }

  canGoPreviousSheet(): boolean {
    return this.currentSheet > 0;
  }

  canGoNextSheet(): boolean {
    return this.currentSheet < this.totalSheets - 1;
  }
}
