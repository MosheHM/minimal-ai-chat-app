import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ContentChildren,
  ElementRef,
  forwardRef,
  inject,
  QueryList,
  Renderer2,
  SimpleChanges,
  ViewChild,
  input,
  model,
  output,
  signal,
} from '@angular/core';
import { FormsModule, NG_VALUE_ACCESSOR, ReactiveFormsModule } from '@angular/forms';
import { MatFormField, MatInputModule } from '@angular/material/input';
import { MatSelect, MatSelectModule } from '@angular/material/select';
import { AmitalInputService } from '../amital-input/amital-input.service';
import { nameof } from '../../../../util/util';
import { AmitalSelectService } from './amital-select.service';
import { MatFormFieldModule } from '@angular/material/form-field';
import { AmitalIconArrowDownComponent } from '../../assets/icons/system/amital-icon-arrow-down.component';
import { AmitalIconArrowUpComponent } from '../../assets/icons/system/amital-icon-arrow-up.component';
import { CommonModule } from '@angular/common';
import * as themeColor from '../../theme/theme';
import { AmitalIconPlusComponent } from '../../assets/icons/system/amital-icon-plus.component';
import { AmitalOptionComponent } from './amital-option.component';
import { AmitalIconErrorComponent } from '../../assets/icons/system/amital-icon-error.component';
import { AmitalTooltipComponent } from '../amital-tooltip/amital-tooltip.component';
import { TooltipPosition } from '@angular/material/tooltip';
import { AmitalSelectBaseComponent } from '../amital-input/amital-select-base';
import { AmitalLabelComponent } from '../amital-label/amital-label.component';
import { ScrollLoadService } from '../../services/scroll-load.service';
import { AmitalHelperComponent } from '../amital-helper/amital-helper.component';

@Component({
  selector: 'amital-select',
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    AmitalIconArrowDownComponent,
    AmitalIconArrowUpComponent,
    AmitalIconPlusComponent,
    AmitalIconErrorComponent,
    AmitalTooltipComponent,
    AmitalLabelComponent,
    AmitalHelperComponent,
  ],
  providers: [
    AmitalInputService,
    ScrollLoadService,
    AmitalSelectService,
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => AmitalSelectComponent),
      multi: true,
    },
  ],
  standalone: true,
  templateUrl: './amital-select.component.html',
  styleUrl: './amital-select.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AmitalSelectComponent extends AmitalSelectBaseComponent {
  amitalSelectService = inject(AmitalSelectService);
  @ViewChild(MatFormField, { read: ElementRef }) formRef!: ElementRef<HTMLButtonElement>;
  @ViewChild('select') select!: MatSelect;
  @ContentChildren(AmitalOptionComponent) optionsRef!: QueryList<AmitalOptionComponent>;

  override fieldType = model<'string' | 'number' | 'boolean' | 'password' | 'email' | undefined>(undefined);
  tooltip = input<string>();
  tooltipPosition = input<TooltipPosition>('above');
  ariaDescribedBy = input<string>();
  multiple = input(false);
  dropdownWidth = input<string | number | null>(null);
  dropdownHeight = input<string>();
  showAddNewButton = input(false);
  hasHelp = input<boolean>(false);
  useMarkdown = input<boolean>(false);
  autoCloseDelay = input<number | null>();
  displayColumns = input<string[]>([]);
  onAddNew = output<void>();

  private resizeObserver: ResizeObserver | null = null;
  panelWidth = signal<string | number | null>(null);
  panelOpen = false;
  theme = themeColor;
  loading = false;

  constructor(
    cdr: ChangeDetectorRef,
    private renderer: Renderer2
  ) {
    super(cdr);
  }

  ngAfterViewInit(): void {
    this.formRef.nativeElement.style.width = this.width();
    this.initLazyLoad();
    this.initResizeListener();
  }

  override ngOnDestroy(): void {
    super.ngOnDestroy();
    this.resizeObserver?.disconnect();
  }

  async ngOnChanges(changes: SimpleChanges): Promise<void> {
    const value = this.value();

    if (
      changes[nameof<this>((x) => x.objectField)] ||
      changes[nameof<this>((x) => x.objectTable)] ||
      changes[nameof<this>((x) => x.lookupTable)] ||
      changes[nameof<this>((x) => x.valueField)] ||
      changes[nameof<this>((x) => x.displayField)]
    ) {
      await this.initObjectField();
      this.amitalInputService.initFormGroup(this);
      const lookupTableUpdate = await this.initLookupList();
      if (lookupTableUpdate) this.initGetRow();
    }

    if (changes[nameof<this>((x) => x.value)] && this.formControl.value !== value) this.formControl.setValue(value);

    if (changes[nameof<this>((x) => x.formGroup)] || changes[nameof<this>((x) => x.fieldName)])
      this.amitalInputService.initFormGroup(this);

    if (changes[nameof<this>((x) => x.readonly)] && this.select) this.select.disabled = this.readonly();

    if (changes[nameof<this>((x) => x.disabled)]) {
      if (this.disabled()) this.formControl.disable({ emitEvent: false });
      else this.formControl.enable({ emitEvent: false });
    }

    if (changes[nameof<this>((x) => x.getRows)] && !!this.getRows()) this.initGetRow();

    this.initDefaultProperties();
    this.cdr.detectChanges();
  }

  initDefaultProperties(): void {
    this.required.update((currentValue) =>
      this.amitalInputService.setData(this.objectFieldData?.IsRequiered, currentValue, false)
    );
    this.fieldType.update((currentValue) =>
      this.amitalInputService.setData(
        this.amitalInputService.mapDataTypeCodeToType(this.objectFieldData?.DataTypeCode),
        currentValue
      )
    );
    this.labelTextCode.update((currentValue) =>
      this.amitalInputService.setData(this.objectFieldData?.FullNameTextCodeCode, currentValue)
    );

    this.amitalInputService.initValidators(this);
  }

  initLazyLoad(): void {
    this.listenerToScroll();
  }

  listenerToScroll(): void {
    this.select.openedChange.subscribe((opened) => {
      if (!opened || !this.isLazyLoad()) return;

      this.cdr.detectChanges();
      const panel = this.select?.panel?.nativeElement as HTMLElement;

      if (!panel) return;

      this.scrollLoadService.attachScrollListener(panel);
      if (this.dropdownHeight()) this.renderer.setStyle(panel, 'max-height', this.dropdownHeight());
    });
  }

  private initResizeListener(): void {
    const form = this.formRef?.nativeElement;
    if (!form) return;
    this.resizeObserver = new ResizeObserver(() => this.panelWidth.set(form.offsetWidth + 'px'));
    this.resizeObserver.observe(form);
  }

  get resolvedHelpTitle(): string | undefined {
    return this.helpTitle() ?? this.objectFieldData?.FullNameTextCodeDefaultText;
  }

  get resolvedHelpContent(): string | null {
    return (
      this.helpContent() ??
      this.objectFieldData?.HelpTextTranslatedText ??
      this.objectFieldData?.HelpTextCodeDefaultText ??
      null
    );
  }

  open(): void {
    this.select?.open();
  }
  close(): void {
    this.select?.close();
  }
}
