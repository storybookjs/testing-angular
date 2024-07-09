import { composeStories, createMountable } from '@storybook/testing-angular';

import { render, screen } from '@testing-library/angular';

import * as stories from './with-signal-input.stories';

const composed = composeStories(stories);

describe('with signal input stories test', () =>
  it('should render and validate story', async () => {
    const { component, applicationConfig } = createMountable(composed.Primary({}));
    await render(component, { providers: applicationConfig.providers });
    expect(screen.getByText("Is Primary: false")).not.toBeNull();
  }));
