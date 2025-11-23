import { Component, input, TemplateRef, ViewChild } from '@angular/core';

@Component({
  selector: 'amital-option',
  standalone: true,
  template: '<ng-template #template><ng-content></ng-content></ng-template>',
})
export class AmitalOptionComponent {
  value = input();
  @ViewChild('template') template!: TemplateRef<any>;
}
