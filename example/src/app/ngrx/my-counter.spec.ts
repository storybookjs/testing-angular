import { composeStories, composeStory, createMountable } from '@storybook/testing-angular';

import { render, screen } from '@testing-library/angular';

import * as stories from './my-counter.stories';
import { MyCounterComponent } from './my-counter.component';

const composed: any = composeStories<MyCounterComponent>(stories);

describe('interactive stories test', () =>
  it('should render and validate story', async () => {
    const { component, applicationConfig } = createMountable(composed.Primary({}, {} as any));
    await render(component, { providers: applicationConfig.providers });
    expect(screen.getByText("Current Count: 0")).not.toBeNull();
  }));
