import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AmitalDocViewerToolbarComponent } from './amital-doc-viewer-toolbar.component';

describe('AmitalDocViewerToolbarComponent', () => {
  let component: AmitalDocViewerToolbarComponent;
  let fixture: ComponentFixture<AmitalDocViewerToolbarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AmitalDocViewerToolbarComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(AmitalDocViewerToolbarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
