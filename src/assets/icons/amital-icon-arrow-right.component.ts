import { ChangeDetectionStrategy, Component } from '@angular/core';
import { BaseIconComponent } from './base-icon.component';

@Component({
  selector: 'amital-icon-arrow-right',
  standalone: true,
  template: `<svg width="24" height="24" viewBox="0 0 6 11" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M5.59433 5.45092L1.04888 0.905593C0.871392 0.728078 0.583574 0.728078 0.406059 0.905624C0.228574 1.08314 0.228574 1.37093 0.406089 1.54844L4.63012 5.77238L0.406059 9.99652C0.228574 10.174 0.228574 10.4618 0.406089 10.6393C0.494816 10.7281 0.61115 10.7725 0.727483 10.7725C0.843816 10.7725 0.960149 10.7281 1.04891 10.6393L5.59433 6.09374C5.6796 6.0085 5.72748 5.89289 5.72748 5.77235C5.72748 5.6518 5.6796 5.53616 5.59433 5.45092Z"
      fill="#1C1C1C"
    />
  </svg>`,
  styleUrls: ['./icon.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AmitalIconArrowRightComponent extends BaseIconComponent {}
