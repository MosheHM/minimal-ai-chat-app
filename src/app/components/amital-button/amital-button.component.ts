import { CommonModule } from '@angular/common';
import {
  Component,
  HostBinding,
  ElementRef,
  ViewChild,
  Renderer2,
  SimpleChanges,
  ChangeDetectorRef,
  OnChanges,
  input,
} from '@angular/core';
import { MatButton, MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'amital-button',
  standalone: true,
  imports: [MatButtonModule, CommonModule],
  templateUrl: './amital-button.component.html',
  styleUrls: ['./amital-button.component.scss'],
})
export class AmitalButtonComponent implements OnChanges {
  disabled = input(false);
  @HostBinding('class.disabled') get _disabled(): boolean {
    return this.disabled();
  }
  color = input<'primary' | 'accent' | 'warn'>('primary');
  @HostBinding('class') get _color(): string {
    return this.color();
  }
  @HostBinding('attr.aria-disabled') get ariaDisabled(): boolean {
    return this.disabled();
  }
  width = input('');
  @HostBinding('style.--width') get _width(): string {
    return this.width();
  }
  height = input('');
  @HostBinding('style.--height') get _height(): string {
    return this.height();
  }
  border = input('');
  @HostBinding('style.--border') get _border(): any {
    return this.border() || undefined;
  }
  @HostBinding('class.border') get _borderClass(): any {
    return !!this.border();
  }
  type = input<'fill' | 'stroked' | 'ghost'>('fill');
  size = input<number>(14);
  borderRadius = input('');
  @HostBinding('style.--border-radius') get _borderRadius(): string {
    return this.borderRadius();
  }

  @ViewChild('button') matButton!: MatButton;
  @ViewChild('button', { read: ElementRef }) public buttonRef!: ElementRef<HTMLButtonElement>;

  constructor(
    private renderer: Renderer2,
    private cdr: ChangeDetectorRef
  ) {}

  ngAfterViewInit(): void {
    this.setSize();
    this.setColor();
    this.setDisabled();
    this.cdr.detectChanges();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['size'] && !changes['size'].firstChange) this.setSize();
    if (changes['color'] && !changes['color'].firstChange) this.setColor();
    if (changes['disabled'] && !changes['disabled'].firstChange) this.setDisabled();
  }

  setSize(): void {
    const btn = this.buttonRef?.nativeElement;
    if (!btn) return;

    [
      ['font-size', this.size() + 'px'],
      ['height', this.size() * 2 + 'px'],
      ['padding', '0 ' + this.size() * 1.5 + 'px'],
    ].forEach((css) => this.renderer.setStyle(btn, css[0], css[1]));
  }

  setColor(): void {
    this.matButton.color = this.color();
  }

  setDisabled(): void {
    this.matButton.disabled = this.disabled();
    this.matButton.ariaDisabled = this.disabled();
  }
}
