import { render, screen } from '@testing-library/angular'
import { composeStories, createMountableStoryComponent } from '../../../dist/index'
import * as stories from './Button.stories' // import all stories from the stories file

// Every component that is returned maps 1:1 with the stories, but they already contain all decorators from story level, meta level and global level.
const { Primary } = composeStories(stories)

describe('button', () => {
  it('renders primary button', async () => {
    const tmp = createMountableStoryComponent((Primary as any)())
    await render(tmp.component, {
      imports: [ tmp.module ]
    })
    const buttonElement = screen.getByText(Primary.args?.label!);
    expect(buttonElement).not.toBeNull();
  })
})
