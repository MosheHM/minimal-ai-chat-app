import { Directive, HostBinding, input } from '@angular/core';

@Directive()
export abstract class BaseIconComponent {
  size = input<number>(24);
  @HostBinding('style.--icon-size.px') get _size(): number {
    return this.size();
  }

  colorLine = input<string>('');
  @HostBinding('style.--icon-color-line') get _colorLine(): string {
    return this.colorLine();
  }

  colorFill = input<string>('');
  @HostBinding('style.--icon-color-fill') get _colorFill(): string {
    return this.colorFill ? this.colorFill() : '';
  }

  disabled = input<boolean>(false);
  @HostBinding('class.disabled') get _disabled(): boolean {
    return this.disabled();
  }

  button = input<boolean>(false);
  @HostBinding('class.icon-button') get _button(): boolean {
    return this.button();
  }

  @HostBinding('attr.tabindex') get tabindex(): number | null {
    return this.button() && !this.disabled() ? 0 : null;
  }

  @HostBinding('attr.role') get role(): string | null {
    return this.button() ? 'button' : null;
  }

  @HostBinding('attr.aria-disabled') get ariaDisabled(): string | null {
    return this.button() ? String(this.disabled()) : null;
  }

  @HostBinding('class.stroke') get isStroke(): boolean {
    return this.colorLine() !== '';
  }

  @HostBinding('class.fill') get isFill(): boolean {
    return this.colorFill !== undefined && this.colorFill() !== '';
  }

  @HostBinding('attr.title') title = '';
}
