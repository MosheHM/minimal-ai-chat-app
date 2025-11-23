import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AmitalButtonComponent } from './amital-button.component';
import { detectChangesOnPush, updateFunctionInputsAsync } from '../../../../test/test-util';

describe('AmitalButtonComponent', () => {
  let fixture: ComponentFixture<AmitalButtonComponent>;
  let component: AmitalButtonComponent;
  let buttonEl: HTMLButtonElement;
  let computedButton: CSSStyleDeclaration;
  let componentElement: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AmitalButtonComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(AmitalButtonComponent);
    component = fixture.componentInstance;

    detectChangesOnPush(fixture);

    buttonEl = fixture.nativeElement.querySelector('button');
    computedButton = getComputedStyle(buttonEl);
    componentElement = fixture.componentRef.location.nativeElement as HTMLElement;
  });

  it('should create and have correct default inputs & styles', () => {
    expect(component).toBeTruthy();
    expect(component.type()).toBe('fill');
    expect(component.size()).toBe(14);
    expect(component.color()).toBe('primary');

    expect(buttonEl.style.fontSize).toBe('14px');
    expect(buttonEl.style.height).toBe('28px');
    expect(buttonEl.style.padding).toBe('0px 21px');

    expect(computedButton.backgroundColor).toBe('rgb(0, 113, 206)');
    expect(buttonEl.hasAttribute('disabled')).toBeFalse();
  });

  it('should disable when input is true', async () => {
    await updateFunctionInputsAsync(fixture, { disabled: true });

    expect(buttonEl.hasAttribute('disabled')).toBeTrue();
    expect(componentElement.classList).toContain('disabled');
    expect(computedButton.color).toBe('rgb(104, 105, 107)');
    expect(computedButton.pointerEvents).toBe('none');
  });

  it('should react to size changes', async () => {
    await updateFunctionInputsAsync(fixture, { size: 20 });
    expect(buttonEl.style.fontSize).toBe('20px');
    expect(buttonEl.style.height).toBe('40px');
    expect(buttonEl.style.padding).toBe('0px 30px');
  });

  it('should switch to stroked style when type="stroked"', async () => {
    await updateFunctionInputsAsync(fixture, { type: 'stroked' });
    const buttonElement = fixture.nativeElement.querySelector('button') as HTMLButtonElement;

    expect(buttonElement.hasAttribute('mat-stroked-button')).toBeTrue();
    expect(getComputedStyle(buttonElement).backgroundColor).toBe('rgba(0, 0, 0, 0)');
  });

  it('should apply borderRadius input as CSS variable', async () => {
    await updateFunctionInputsAsync(fixture, { borderRadius: '8px' });
    detectChangesOnPush(fixture);

    expect(componentElement.style.getPropertyValue('--border-radius')).toBe('8px');
    expect(computedButton.borderRadius).toBe('8px');
  });

  it('should update borderRadius dynamically', async () => {
    await updateFunctionInputsAsync(fixture, { borderRadius: '16px' });
    detectChangesOnPush(fixture);

    expect(componentElement.style.getPropertyValue('--border-radius')).toBe('16px');
    expect(computedButton.borderRadius).toBe('16px');
  });

  it('should have empty borderRadius by default', () => {
    expect(component.borderRadius()).toBe('');
    expect(componentElement.style.getPropertyValue('--border-radius')).toBe('');
    expect(computedButton.borderRadius).toBe('500px');
  });

  it('should update color input and reflect on button', async () => {
    await updateFunctionInputsAsync(fixture, { color: 'accent' });
    detectChangesOnPush(fixture);

    expect(component.color()).toBe('accent');
    expect(computedButton.backgroundColor).not.toBe('rgb(0, 113, 206)');
  });

  it('should update type input and reflect correct mat-button directive', async () => {
    await updateFunctionInputsAsync(fixture, { type: 'fill' });
    detectChangesOnPush(fixture);

    const buttonElement = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    expect(buttonElement.hasAttribute('mat-flat-button')).toBeTrue();
    expect(buttonElement.hasAttribute('mat-stroked-button')).toBeFalse();
  });
});
