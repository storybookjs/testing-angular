import { render, screen } from '@testing-library/angular';
import { composeStories, createMountableStoryComponent } from '@marklb/storybook-testing-angular'

import * as stories from './Button.stories'; // import all stories from the stories file

import { TestBed } from '@angular/core/testing';

// Every component that is returned maps 1:1 with the stories, but they already contain all decorators from story level, meta level and global level.
const { Primary } = composeStories(stories);

describe('button TestBed', () => {
  const { component, ngModule } = createMountableStoryComponent((Primary as any)());

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        ngModule
      ],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(component);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should render title', () => {
    const fixture = TestBed.createComponent(component);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('button')?.textContent).toContain(Primary.args?.label!);
  });
});

describe('button testing-library', () => {
  it('renders primary button', async () => {
    const { component, ngModule } = createMountableStoryComponent((Primary as any)());
    await render(component, {
      imports: [ ngModule ]
    });
    console.log(document.body.innerHTML)
    const buttonElement = screen.getByText(Primary.args?.label!);
    expect(buttonElement).not.toBeNull();
  })
})
