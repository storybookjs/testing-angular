import { render, screen } from '@testing-library/angular';
import { composeStories, composeStory, createMountableStoryComponent } from '@storybook/testing-angular';

import { ButtonComponent } from './button.component';
// import * as stories from './Button.stories'; // import all stories from the stories file
import { Primary as _Primary, Other as _Other } from './Button.stories';
import Meta from './Button.stories';

import { TestBed } from '@angular/core/testing';
import { ApplicationConfig } from '@angular/core';

// Every component that is returned maps 1:1 with the stories, but they already contain all decorators from story level, meta level and global level.
// const { Primary } = composeStories<ButtonComponent>(stories);
// const composed: any = composeStories<ButtonComponent>(stories);
// const Primary: any = composed.Primary;

const Primary = composeStory<ButtonComponent>(_Primary, Meta)
const Other = composeStory<ButtonComponent>(_Other, Meta)
// const Primary = composeStory<ButtonComponent>(stories.Primary, Meta)
// const Other = composeStory<ButtonComponent>(stories.Other, Meta)


describe('button TestBed', () => {
  let component: any
  let applicationConfig: ApplicationConfig

  beforeEach(async () => {
    const componentAndConfig = createMountableStoryComponent(Primary({}, {} as any), Meta.component);
    component = componentAndConfig.component;
    applicationConfig = componentAndConfig.applicationConfig;
    await TestBed.configureTestingModule({}).compileComponents();
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
    console.log(compiled.innerHTML)
    expect(compiled.querySelector('button')?.textContent).toContain(Primary.args?.label!);
  });
});

describe('button testing-library', () => {
  it('renders primary button', async () => {
    const { component } = createMountableStoryComponent(Primary({}, {} as any), Meta.component);
    await render(component);
    expect(screen.getByText(Primary.args?.label!)).not.toBeNull();
  });

  it('renders other button', async () => {
    console.log('Other', Other)
    const { component } = createMountableStoryComponent(Other({}, {} as any), Meta.component);
    await render(component);
    expect(screen.getByText(Other.args?.label!)).not.toBeNull();
  });

  it('renders primary button with spy', async () => {
    const onClickSpy = jasmine.createSpy()
    const { component } = createMountableStoryComponent(Primary({ onClick: onClickSpy as any }, {} as any), Meta.component);
    await render(component);
    const buttonElement = screen.getByText(Primary.args?.label!);
    buttonElement.click();
    expect(onClickSpy as any).toHaveBeenCalled();
  });
});
