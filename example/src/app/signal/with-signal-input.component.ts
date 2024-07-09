import { CommonModule } from '@angular/common';
import { Component, input } from '@angular/core';

@Component({
  selector: 'app-with-signal-input',
  template: `<div>Is Primary: {{ primary() }}</div>`,
  standalone: true,
  imports: [
    CommonModule,
  ],
})
export default class WithSignalInputComponent {
  primary = input(false);
}
