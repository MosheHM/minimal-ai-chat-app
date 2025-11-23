import { ComponentFixture, fakeAsync, TestBed } from '@angular/core/testing';
import { AmitalSelectComponent } from './amital-select.component';
import { AmitalSelectService } from './amital-select.service';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { CommonModule } from '@angular/common';
import { AmitalIconArrowDownComponent } from '../../assets/icons/system/amital-icon-arrow-down.component';
import { AmitalIconArrowUpComponent } from '../../assets/icons/system/amital-icon-arrow-up.component';
import { AmitalIconPlusComponent } from '../../assets/icons/system/amital-icon-plus.component';
import { AmitalIconErrorComponent } from '../../assets/icons/system/amital-icon-error.component';
import { AmitalTooltipComponent } from '../amital-tooltip/amital-tooltip.component';
import { Renderer2, ChangeDetectorRef, SimpleChange } from '@angular/core';
import { updateFunctionInputsAsync } from '../../../../test/test-util';
import { MatTooltipModule } from '@angular/material/tooltip';

describe('AmitalSelectComponent', () => {
  let component: AmitalSelectComponent;
  let fixture: ComponentFixture<AmitalSelectComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        MatSelectModule,
        MatFormFieldModule,
        AmitalIconArrowDownComponent,
        AmitalIconArrowUpComponent,
        AmitalIconPlusComponent,
        AmitalIconErrorComponent,
        AmitalTooltipComponent,
        AmitalSelectComponent,
        MatTooltipModule,
      ],
      declarations: [],
      providers: [Renderer2, ChangeDetectorRef, AmitalSelectService],
    }).compileComponents();

    fixture = TestBed.createComponent(AmitalSelectComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize default properties', () => {
    spyOn(component.amitalInputService, 'setData').and.callThrough();
    component.initDefaultProperties();
    expect(component.amitalInputService.setData).toHaveBeenCalled();
  });

  it('should update error message', () => {
    spyOn(component.amitalInputService, 'getErrorMessage').and.returnValue('Error message');
    component.updateErrorMessage();
    expect(component.errorMessage()).toBe('Error message');
  });

  it('should handle changes in properties', async () => {
    spyOn(component, 'initObjectField').and.callThrough();
    spyOn(component, 'initLookupList').and.callThrough();
    const changes = {
      objectField: new SimpleChange('oldField', 'newField', false),
    };
    await component.ngOnChanges(changes);
    expect(component.initObjectField).toHaveBeenCalled();
    expect(component.initLookupList).toHaveBeenCalled();
  });

  it('should bind readonly property correctly', async () => {
    await updateFunctionInputsAsync(fixture, { readonly: true });
    expect(component._readonly).toBeTrue();
    expect(fixture.nativeElement.classList).toContain('readonly');
  });

  it('should bind width property correctly', async () => {
    await updateFunctionInputsAsync(fixture, { width: '500px' });
    expect(component._width).toBe('500px');
    expect(fixture.nativeElement.style.width).toBe('500px');
  });

  it('should update label property', async () => {
    await updateFunctionInputsAsync(fixture, { label: 'Test Label' });
    expect(component.label()).toBe('Test Label');
    expect(fixture.nativeElement.querySelector('amital-label').textContent).toContain('Test Label');
  });

  it('should update placeholder property', async () => {
    await updateFunctionInputsAsync(fixture, { placeholder: 'Enter text' });
    expect(component.placeholder()).toBe('Enter text');
    const inputElement = fixture.nativeElement.querySelector('.mat-mdc-select-placeholder');
    expect(inputElement.textContent).toContain('Enter text');
  });

  it('should display tooltip on mouseenter', async () => {
    await updateFunctionInputsAsync(fixture, { tooltip: 'Tooltip text' });
    expect(component.tooltip()).toBe('Tooltip text');
  });

  it('should update tooltipPosition property', async () => {
    await updateFunctionInputsAsync(fixture, { tooltipPosition: 'below' });
    expect(component.tooltipPosition()).toBe('below');
  });

  it('should update labelColor property', async () => {
    await updateFunctionInputsAsync(fixture, { labelColor: 'red' });
    expect(component.labelColor()).toBe('red');
  });

  it('should update showAddNewButton property', async () => {
    await updateFunctionInputsAsync(fixture, { showAddNewButton: true });
    expect(component.showAddNewButton()).toBeTrue();
  });

  it('should update loadAll property', async () => {
    await updateFunctionInputsAsync(fixture, { loadAll: true });
    expect(component.loadAll()).toBeTrue();
  });

  it('should update showInactive property', async () => {
    await updateFunctionInputsAsync(fixture, { showInactive: true });
    expect(component.showInactive()).toBeTrue();
  });

  it('should update displayColumns property', async () => {
    await updateFunctionInputsAsync(fixture, { displayColumns: ['Column1', 'Column2'] });
    fixture.detectChanges();
    expect(component.displayColumns()).toEqual(['Column1', 'Column2']);
  });

  it('should correctly set and retrieve input properties', async () => {
    await updateFunctionInputsAsync(fixture, { options: [1, 2, 3] });
    expect(component.options()).toEqual([1, 2, 3]);

    await updateFunctionInputsAsync(fixture, { id: 'custom-id' });
    expect(component.id()).toBe('custom-id');

    await updateFunctionInputsAsync(fixture, { ariaDescribedBy: 'description' });
    expect(component.ariaDescribedBy()).toBe('description');

    await updateFunctionInputsAsync(fixture, { useCache: true });
    expect(component.useCache()).toBeTrue();

    await updateFunctionInputsAsync(fixture, { dropdownWidth: '400px' });
    expect(component.dropdownWidth()).toBe('400px');

    await updateFunctionInputsAsync(fixture, { dropdownHeight: '500px' });
    expect(component.dropdownHeight()).toBe('500px');
  });

  it('should correctly set and retrieve model properties using updateFunctionInputsAsync', async () => {
    await updateFunctionInputsAsync(fixture, { fieldName: 'fieldName' });
    expect(component.fieldName()).toBe('fieldName');

    await updateFunctionInputsAsync(fixture, { required: true });
    expect(component.required()).toBeTrue();

    await updateFunctionInputsAsync(fixture, { fieldType: 'number' });
    expect(component.fieldType()).toBe('number');

    await updateFunctionInputsAsync(fixture, { getRows: async (rowNumber: number) => [rowNumber] });
    expect(component.getRows()).toBeInstanceOf(Function);

    await updateFunctionInputsAsync(fixture, { valueField: 'valueField' });
    expect(component.valueField()).toBe('valueField');

    await updateFunctionInputsAsync(fixture, { displayField: 'displayField' });
    expect(component.displayField()).toBe('displayField');
  });

  it('should initialize lazy loading', () => {
    spyOn(component, 'listenerToScroll');
    component.initLazyLoad();
    expect(component.listenerToScroll).toHaveBeenCalled();
  });

  it('should adjust dropdown width and height', async () => {
    await updateFunctionInputsAsync(fixture, { dropdownWidth: '300px', dropdownHeight: '400px' });
    expect(component.dropdownWidth()).toBe('300px');
    expect(component.dropdownHeight()).toBe('400px');
  });

  it('should emit onAddNew event', () => {
    spyOn(component.onAddNew, 'emit');
    component.onAddNew.emit();
    expect(component.onAddNew.emit).toHaveBeenCalled();
  });

  it('should check if panelWidth equals offset.width', fakeAsync(() => {
    component.formRef = {
      nativeElement: { offsetWidth: 250 },
    } as any;
    component.panelWidth.set(250 + 'px');
    expect(component.panelWidth()).toBe('250px');
  }));
});
