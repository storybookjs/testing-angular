import { composeStories, composeStory, createMountable } from '@storybook/testing-angular';

import { render, screen } from '@testing-library/angular';

import * as stories from './my-counter.stories';
import meta, { Primary } from './my-counter.stories';

const composed = composeStories(stories);

const _Primary = composeStory(Primary, meta);

describe('interactive stories test', () => {
  describe('composeStories', () => {
    it('should render and validate story', async () => {
      const { component, applicationConfig } = createMountable(composed.Primary({}));
      await render(component, { providers: applicationConfig.providers });
      expect(screen.getByText("Current Count: 0")).not.toBeNull();
    });
  });

  describe('composeStory', () => {
    it('should render and validate story', async () => {
      const { component, applicationConfig } = createMountable(_Primary({}));
      await render(component, { providers: applicationConfig.providers });
      expect(screen.getByText("Current Count: 0")).not.toBeNull();
    });
  });
});
