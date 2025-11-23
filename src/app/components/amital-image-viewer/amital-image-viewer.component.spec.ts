import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AmitalImageViewerComponent } from './amital-image-viewer.component';

describe('AmitalImageViewerComponent', () => {
  let component: AmitalImageViewerComponent;
  let fixture: ComponentFixture<AmitalImageViewerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AmitalImageViewerComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(AmitalImageViewerComponent);
    component = fixture.componentInstance;

    spyOn(console, 'warn').and.stub();
    spyOn(console, 'error').and.stub();

    fixture.componentRef.setInput(
      'src',
      'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAiIGhlaWdodD0iMTAiIHZpZXdCb3g9IjAgMCAxMCAxMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48Y2lyY2xlIGN4PSI1IiBjeT0iNSIgcj0iNSIgZmlsbD0iIzAwMCIgLz48L3N2Zz4='
    );
  });

  afterEach(() => {
    if (component.imageSrc && component.imageSrc.startsWith('blob:')) {
      URL.revokeObjectURL(component.imageSrc);
    }
  });

  it('should create', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('should initialize with default values', () => {
    expect(component.showToolbar()).toBe(true);
    expect(component.allowDownload()).toBe(true);
    expect(component.allowRotation()).toBe(true);
    expect(component.allowZoom()).toBe(true);
    expect(component.currentZoom).toBe(100);
    expect(component.currentRotation).toBe(0);
  });

  it('should handle custom input values', () => {
    fixture.componentRef.setInput('showToolbar', false);
    fixture.componentRef.setInput('allowDownload', false);
    fixture.componentRef.setInput('allowRotation', false);
    fixture.componentRef.setInput('allowZoom', false);
    fixture.componentRef.setInput('fileName', 'test.jpg');
    fixture.componentRef.setInput('alt', 'Test image');

    expect(component.showToolbar()).toBe(false);
    expect(component.allowDownload()).toBe(false);
    expect(component.allowRotation()).toBe(false);
    expect(component.allowZoom()).toBe(false);
    expect(component.fileName()).toBe('test.jpg');
    expect(component.alt()).toBe('Test image');
  });

  describe('Zoom functionality', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should zoom in when allowed', () => {
      fixture.componentRef.setInput('allowZoom', true);
      component.currentZoom = 100;

      component.zoomIn();

      expect(component.currentZoom).toBe(125);
    });

    it('should not zoom in when not allowed', () => {
      fixture.componentRef.setInput('allowZoom', false);
      component.currentZoom = 100;

      component.zoomIn();

      expect(component.currentZoom).toBe(100);
    });

    it('should zoom out when allowed', () => {
      fixture.componentRef.setInput('allowZoom', true);
      component.currentZoom = 100;

      component.zoomOut();

      expect(component.currentZoom).toBe(75);
    });

    it('should not zoom out when not allowed', () => {
      fixture.componentRef.setInput('allowZoom', false);
      component.currentZoom = 100;

      component.zoomOut();

      expect(component.currentZoom).toBe(100);
    });

    it('should respect zoom limits', () => {
      fixture.componentRef.setInput('allowZoom', true);

      // Test max zoom limit
      component.currentZoom = 500;
      component.zoomIn();
      expect(component.currentZoom).toBe(500);

      // Test min zoom limit
      component.currentZoom = 25;
      component.zoomOut();
      expect(component.currentZoom).toBe(25);
    });
  });

  describe('Rotation functionality', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should rotate clockwise when allowed', () => {
      fixture.componentRef.setInput('allowRotation', true);

      component.rotateClockwise();
      expect(component.currentRotation).toBe(90);

      component.rotateClockwise();
      expect(component.currentRotation).toBe(180);

      component.rotateClockwise();
      expect(component.currentRotation).toBe(270);

      component.rotateClockwise();
      expect(component.currentRotation).toBe(0);
    });

    it('should not rotate when not allowed', () => {
      fixture.componentRef.setInput('allowRotation', false);

      component.rotateClockwise();

      expect(component.currentRotation).toBe(0);
    });
  });

  it('should contain supported image formats', () => {
    const formats = component.supportedFormats;

    expect(formats).toContain('jpg');
    expect(formats).toContain('png');
    expect(formats).toContain('gif');
    expect(formats).toContain('svg');
    expect(formats).toContain('webp');
  });
});
