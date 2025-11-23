import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ElementRef } from '@angular/core';
import { AmitalWordViewerComponent } from './amital-word-viewer.component';

const mockDocxRenderAsync = jasmine.createSpy('renderAsync').and.returnValue(Promise.resolve());

class MockResizeObserver {
  constructor(public callback: ResizeObserverCallback) {}
  observe(_element: Element): void {
    /* Mock */
  }
  disconnect(): void {
    /* Mock */
  }
  unobserve(_element: Element): void {
    /* Mock */
  }
}

describe('AmitalWordViewerComponent', () => {
  let component: AmitalWordViewerComponent;
  let fixture: ComponentFixture<AmitalWordViewerComponent>;

  beforeEach(async () => {
    (window as any).docx = { renderAsync: mockDocxRenderAsync };
    (window as any).ResizeObserver = MockResizeObserver;
    spyOn(URL, 'createObjectURL').and.returnValue('blob:mock-url');
    spyOn(URL, 'revokeObjectURL').and.stub();

    await TestBed.configureTestingModule({
      imports: [AmitalWordViewerComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(AmitalWordViewerComponent);
    component = fixture.componentInstance;

    fixture.componentRef.setInput('src', 'test.docx');

    component.docxContainer = new ElementRef(document.createElement('div'));
    component.documentWrapper = new ElementRef(document.createElement('div'));
    component.wordViewerContainer = new ElementRef(document.createElement('div'));

    spyOn(component as any, 'loadDocument').and.returnValue(Promise.resolve());
    spyOn(component as any, 'setupResizeObserver').and.stub();
    spyOn(component as any, 'processSrc').and.stub();
  });

  afterEach(() => {
    fixture.destroy();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with default values', () => {
    expect(component.fileName()).toBe('');
    expect(component.showToolbar()).toBe(true);
    expect(component.allowDownload()).toBe(true);
    expect(component.allowZoom()).toBe(true);
    expect(component.currentZoom).toBe(80);
    expect(component.isLoading).toBe(true);
    expect(component.hasError).toBe(false);
  });

  describe('Input Properties', () => {
    it('should handle string src', () => {
      const testSrc = 'https://example.com/document.docx';
      fixture.componentRef.setInput('src', testSrc);
      expect(component.src()).toBe(testSrc);
    });

    it('should handle Blob src', () => {
      const blob = new Blob(['test']);
      fixture.componentRef.setInput('src', blob);
      expect(component.src()).toBe(blob);
    });

    it('should handle optional inputs', () => {
      fixture.componentRef.setInput('fileName', 'my-document.docx');
      fixture.componentRef.setInput('showToolbar', false);
      fixture.componentRef.setInput('allowDownload', false);
      fixture.componentRef.setInput('allowZoom', false);

      expect(component.fileName()).toBe('my-document.docx');
      expect(component.showToolbar()).toBe(false);
      expect(component.allowDownload()).toBe(false);
      expect(component.allowZoom()).toBe(false);
    });
  });

  describe('Zoom Functionality', () => {
    it('should zoom in and out when allowed', () => {
      fixture.componentRef.setInput('allowZoom', true);
      component.currentZoom = 100;

      component.zoomIn();
      expect(component.currentZoom).toBe(120);

      component.zoomOut();
      expect(component.currentZoom).toBe(100);
    });

    it('should not zoom if not allowed', () => {
      fixture.componentRef.setInput('allowZoom', false);
      component.currentZoom = 100;

      component.zoomIn();
      expect(component.currentZoom).toBe(100);

      component.zoomOut();
      expect(component.currentZoom).toBe(100);
    });

    it('should respect zoom limits', () => {
      fixture.componentRef.setInput('allowZoom', true);
      component.currentZoom = component.maxZoom;
      component.zoomIn();
      expect(component.currentZoom).toBe(component.maxZoom);

      component.currentZoom = component.minZoom;
      component.zoomOut();
      expect(component.currentZoom).toBe(component.minZoom);
    });

    it('should set zoom to a specific value within limits', () => {
      fixture.componentRef.setInput('allowZoom', true);
      component.setZoom(150);
      expect(component.currentZoom).toBe(150);

      component.setZoom(component.maxZoom + 100);
      expect(component.currentZoom).toBe(component.maxZoom);

      component.setZoom(component.minZoom - 10);
      expect(component.currentZoom).toBe(component.minZoom);
    });
  });

  describe('Download Functionality', () => {
    it('should trigger download when allowed', () => {
      fixture.componentRef.setInput('allowDownload', true);
      fixture.componentRef.setInput('fileName', 'test.docx');
      component.documentSrc = 'blob:mock-url';

      const link = jasmine.createSpyObj('a', ['click']);
      spyOn(document, 'createElement').and.returnValue(link);
      spyOn(document.body, 'appendChild').and.stub();
      spyOn(document.body, 'removeChild').and.stub();

      component.downloadDocument();

      expect(document.createElement).toHaveBeenCalledWith('a');
      expect(link.href).toBe('blob:mock-url');
      expect(link.download).toBe('test.docx');
      expect(link.click).toHaveBeenCalled();
    });

    it('should not trigger download when not allowed', () => {
      fixture.componentRef.setInput('allowDownload', false);
      spyOn(document, 'createElement');
      component.downloadDocument();
      expect(document.createElement).not.toHaveBeenCalled();
    });
  });

  describe('Lifecycle and Error Handling', () => {
    it('should clean up resources on destroy', () => {
      component.documentSrc = 'blob:mock-url';
      const resizeObserver = new MockResizeObserver(() => {
        /* mock */
      });
      spyOn(resizeObserver, 'disconnect');
      component['resizeObserver'] = resizeObserver as any;
      fixture.componentRef.setInput('src', new Blob());

      fixture.destroy();

      expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:mock-url');
      expect(resizeObserver.disconnect).toHaveBeenCalled();
    });

    it('should handle empty src gracefully', fakeAsync(() => {
      const loadErrorSpy = spyOn(component.loadError, 'emit');
      const realProcessSrc = AmitalWordViewerComponent.prototype['processSrc'];

      fixture.componentRef.setInput('src', '');
      realProcessSrc.call(component);
      tick();

      expect(loadErrorSpy).toHaveBeenCalledWith('Word document source is not provided');
      expect(component.hasError).toBe(true);
      expect(component.isLoading).toBe(false);
    }));
  });
});
