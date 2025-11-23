import { ChangeDetectionStrategy, Component } from '@angular/core';
import { BaseIconComponent } from './base-icon.component';

@Component({
  selector: 'amital-icon-rotate',
  standalone: true,
  template: `<svg width="25" height="24" viewBox="0 0 25 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M12.957 5.51172V12.043"
      stroke="#1C1C1C"
      stroke-miterlimit="10"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
    <mask
      id="mask0_1164_37519"
      style="mask-type:luminance"
      maskUnits="userSpaceOnUse"
      x="2"
      y="1"
      width="22"
      height="22"
    >
      <path d="M2 1H24V23H2V1Z" fill="white" />
    </mask>
    <g mask="url(#mask0_1164_37519)">
      <path
        d="M7.88672 17.1133H2.64453V1.64453H9.08984"
        stroke="#1C1C1C"
        stroke-miterlimit="10"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
      <path
        d="M12.957 5.51172H9.08984V1.64453L12.957 5.51172Z"
        stroke="#1C1C1C"
        stroke-miterlimit="10"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
      <path
        d="M19.4883 22.3555H7.88672V12.043H23.3555V18.4883"
        stroke="#1C1C1C"
        stroke-miterlimit="10"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
      <path
        d="M19.4883 22.3555V18.4883H23.3555L19.4883 22.3555Z"
        stroke="#1C1C1C"
        stroke-miterlimit="10"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
      <path
        d="M14.2461 3.01953H18.1133C19.5371 3.01953 20.6914 4.1738 20.6914 5.59766V9.46484"
        stroke="#1C1C1C"
        stroke-miterlimit="10"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
      <path
        d="M15.5352 1.73047L14.2461 3.01953L15.5352 4.30859"
        stroke="#1C1C1C"
        stroke-miterlimit="10"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
      <path
        d="M19.4023 8.17578L20.6914 9.46484L21.9805 8.17578"
        stroke="#1C1C1C"
        stroke-miterlimit="10"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    </g>
  </svg>`,
  styleUrls: ['./icon.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AmitalIconRotateComponent extends BaseIconComponent {}
