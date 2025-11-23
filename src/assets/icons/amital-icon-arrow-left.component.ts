import { ChangeDetectionStrategy, Component } from '@angular/core';
import { BaseIconComponent } from './base-icon.component';

@Component({
  selector: 'amital-icon-arrow-left',
  standalone: true,
  template: `<svg width="24" height="24" viewBox="0 0 6 11" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M0.405674 5.45092L4.95112 0.905593C5.12861 0.728078 5.41643 0.728078 5.59394 0.905624C5.77143 1.08314 5.77143 1.37093 5.59391 1.54844L1.36988 5.77238L5.59394 9.99652C5.77143 10.174 5.77143 10.4618 5.59391 10.6393C5.50518 10.7281 5.38885 10.7725 5.27252 10.7725C5.15618 10.7725 5.03985 10.7281 4.95109 10.6393L0.405674 6.09374C0.320401 6.0085 0.272522 5.89289 0.272522 5.77235C0.272522 5.6518 0.320401 5.53616 0.405674 5.45092Z"
      fill="#1C1C1C"
    />
  </svg>`,
  styleUrls: ['./icon.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AmitalIconArrowLeftComponent extends BaseIconComponent {}
