import { Meta, applicationConfig } from '@storybook/angular';

import { provideStore } from '@ngrx/store';

import { counterReducer } from './counter.reducer';
import { MyCounterComponent } from './my-counter.component';

export default {
  title: 'NGRX/MyCounter',
  component: MyCounterComponent,
  decorators: [
    applicationConfig({
      providers: [provideStore({ count: counterReducer })],
    }),
  ],
} as Meta<MyCounterComponent>;

export const Primary = {
  render: (args: MyCounterComponent) => ({
    props: args,
  }),
  args: {},
};
