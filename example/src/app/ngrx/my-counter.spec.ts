import { composeStory, createMountableStoryComponent } from '@storybook/testing-angular';

import { render, screen } from '@testing-library/angular';

import Meta from './my-counter.stories';
import * as stories from './my-counter.stories';
import { MyCounterComponent } from './my-counter.component';

const Primary = composeStory<MyCounterComponent>(stories.Primary as any, Meta);

describe('interactive stories test', () =>
  it('should render and validate story', async () => {
    const { component, applicationConfig } = createMountableStoryComponent(Primary({}, {} as any), Meta.component);
    await render(component, { providers: applicationConfig.providers });
    expect(screen.getByText("Current Count: 0")).not.toBeNull();
  }));
