import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { DebugElement } from '@angular/core';
import { By } from '@angular/platform-browser';
import { AmitalExcelViewerComponent, ExcelData } from './amital-excel-viewer.component';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

describe('AmitalExcelViewerComponent', () => {
  let component: AmitalExcelViewerComponent;
  let fixture: ComponentFixture<AmitalExcelViewerComponent>;
  let debugElement: DebugElement;

  const createMockFile = (content = 'mock excel content', name = 'test.xlsx'): File => {
    const blob = new Blob([content], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    return new File([blob], name, { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  };

  const createMockExcelData = (): ExcelData => ({
    sheets: [
      {
        headers: ['Name', 'Age', 'City'],
        rows: [
          ['John Doe', '30', 'New York'],
          ['Jane Smith', '25', 'Los Angeles'],
        ],
        totalRows: 2,
        sheetName: 'Sheet1',
      },
    ],
    currentSheetIndex: 0,
    sheetNames: ['Sheet1'],
  });

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AmitalExcelViewerComponent, NoopAnimationsModule],
    }).compileComponents();
  });

  afterEach(() => {
    if (fixture) {
      fixture.destroy();
    }
  });

  const setupComponent = (inputs: Record<string, any> = {}): void => {
    fixture = TestBed.createComponent(AmitalExcelViewerComponent);
    component = fixture.componentInstance;
    debugElement = fixture.debugElement;

    if (!Object.prototype.hasOwnProperty.call(inputs, 'src')) {
      inputs['src'] = createMockFile();
    }

    for (const key in inputs) {
      if (Object.prototype.hasOwnProperty.call(inputs, key)) {
        fixture.componentRef.setInput(key as any, inputs[key]);
      }
    }
  };

  describe('Component Initialization', () => {
    it('should create the component', () => {
      setupComponent();
      fixture.detectChanges();
      expect(component).toBeTruthy();
    });

    it('should show loading state on init', () => {
      spyOn(AmitalExcelViewerComponent.prototype as any, 'processSrc').and.returnValue(
        new Promise((_resolve) => {
          return;
        })
      );
      setupComponent();
      component.isLoading = true;
      fixture.detectChanges();

      const loadingContainer = debugElement.query(By.css('.loading-container'));
      expect(loadingContainer).toBeTruthy();
      const loadingText = debugElement.query(By.css('.loading-text'));
      expect(loadingText.nativeElement.textContent).toContain('Loading Excel file...');
    });

    it('should show an error if src is not provided', fakeAsync(() => {
      spyOn(console, 'error');
      setupComponent({ src: null });
      let caughtError: string | undefined;
      component.loadError.subscribe((err) => (caughtError = err));

      fixture.detectChanges();
      tick();

      expect(component.hasError).toBe(true);
      expect(component.errorMessage).toContain('No source provided');
      expect(caughtError).toContain('No source provided');

      const errorContainer = debugElement.query(By.css('.error-container'));
      expect(errorContainer).toBeTruthy();
    }));
  });

  describe('Data Handling', () => {
    it('should process a file and display data successfully', fakeAsync(() => {
      const mockData = createMockExcelData();
      // Mock the processing logic to return our mock data
      spyOn(AmitalExcelViewerComponent.prototype as any, 'processSrc').and.callFake(() => {
        component.excelData = mockData;
        component.currentSheetData = mockData.sheets[0];
        component.isLoading = false;
        (component as any).updateDisplayData();
      });

      setupComponent();
      fixture.detectChanges(); // Trigger ngOnInit and the mocked processSrc
      tick();
      fixture.detectChanges();

      expect(component.isLoading).toBe(false);
      expect(component.hasError).toBe(false);
      expect(component.excelData).toEqual(mockData);

      const table = debugElement.query(By.css('.excel-table'));
      expect(table).toBeTruthy();

      // Check headers
      const headers = debugElement.queryAll(By.css('.table-header'));
      expect(headers.length).toBe(3);
      expect(headers[0].nativeElement.textContent.trim()).toBe('Name');

      // Check rows
      const rows = debugElement.queryAll(By.css('.table-row'));
      expect(rows.length).toBe(2);
      const firstRowCells = rows[0].queryAll(By.css('.table-cell'));
      expect(firstRowCells[0].nativeElement.textContent.trim()).toBe('John Doe');
    }));

    it('should display an error message when file parsing fails', fakeAsync(() => {
      spyOn(console, 'error'); // Suppress expected error from console
      // Mock the processing to simulate an error
      spyOn(AmitalExcelViewerComponent.prototype as any, 'processSrc').and.callFake(() => {
        (component as any).handleError(new Error('Invalid Excel file format'));
      });

      setupComponent();
      fixture.detectChanges();
      tick();
      fixture.detectChanges();

      expect(component.hasError).toBe(true);
      expect(component.errorMessage).toContain('Invalid Excel file format');

      const errorContainer = debugElement.query(By.css('.error-container'));
      expect(errorContainer).toBeTruthy();
      const retryButton = debugElement.query(By.css('.retry-button'));
      expect(retryButton).toBeTruthy();
    }));
  });

  describe('Public API', () => {
    it('should reload the data when reload() is called', () => {
      setupComponent();
      fixture.detectChanges();

      const processSrcSpy = spyOn(component as any, 'processSrc').and.callThrough();
      component.reload();
      expect(processSrcSpy).toHaveBeenCalled();
    });

    it('should clear all data when clearData() is called', () => {
      const mockData = createMockExcelData();
      setupComponent();
      component.excelData = mockData;
      component.hasError = true;
      fixture.detectChanges();

      component.clearData();
      expect(component.excelData).toBeNull();
      expect(component.hasError).toBe(false);
      expect(component.errorMessage).toBe('');
    });
  });
});
