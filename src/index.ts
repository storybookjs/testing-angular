import { AfterViewInit, ApplicationConfig, Component, NgModule, OnDestroy, Type } from '@angular/core';
import type {
  Meta,
  // Story, StoryContext, Parameters,
  AngularRenderer
} from '@storybook/angular';
import {
  composeStory as originalComposeStory,
  composeStories as originalComposeStories,
  setProjectAnnotations as originalSetProjectAnnotations,
} from '@storybook/preview-api';
import type {
  Args,
  ProjectAnnotations,
  ComposedStory,
  Store_CSFExports,
  StoriesWithPartialProps,
} from '@storybook/types';
import { BehaviorSubject, Subject } from 'rxjs';
import { stringify } from 'telejson';

// import { isInvalidStory, getStorybookModuleMetadata } from './utils';
import { ICollection, StoryFnAngularReturnType } from '@storybook/angular/dist/client/types';
import { render } from '@storybook/angular/dist/client/render'
import { getApplication, storyPropsProvider } from '@storybook/angular/renderer'
import { PropertyExtractor } from '@storybook/angular/dist/client/angular-beta/utils/PropertyExtractor';
// import type { GlobalConfig, StoriesWithPartialProps } from './types';

/** Function that sets the globalConfig of your storybook. The global config is the preview module of your .storybook folder.
 *
 * It should be run a single time, so that your global config (e.g. decorators) is applied to your stories when using `composeStories` or `composeStory`.
 *
 * Example:
 *```jsx
 * // setup.js (for jest)
 * import { setProjectAnnotations } from '@storybook/react';
 * import * as projectAnnotations from './.storybook/preview';
 *
 * setProjectAnnotations(projectAnnotations);
 *```
 *
 * @param projectAnnotations - e.g. (import * as projectAnnotations from '../.storybook/preview')
 */
export function setProjectAnnotations(
  projectAnnotations: ProjectAnnotations<AngularRenderer> | ProjectAnnotations<AngularRenderer>[]
) {
  originalSetProjectAnnotations<AngularRenderer>(projectAnnotations);
}

/** Preserved for users migrating from `@storybook/testing-react`.
 *
 * @deprecated Use setProjectAnnotations instead
 */
export function setGlobalConfig(
  projectAnnotations: ProjectAnnotations<AngularRenderer> | ProjectAnnotations<AngularRenderer>[]
) {
  // deprecate(`setGlobalConfig is deprecated. Use setProjectAnnotations instead.`);
  setProjectAnnotations(projectAnnotations);
}

// This will not be necessary once we have auto preset loading
const defaultProjectAnnotations: ProjectAnnotations<AngularRenderer> = {
  render,
};

/**
 * Function that will receive a story along with meta (e.g. a default export from a .stories file)
 * and optionally projectAnnotations e.g. (import * from '../.storybook/preview)
 * and will return a composed component that has all args/parameters/decorators/etc combined and applied to it.
 *
 *
 * It's very useful for reusing a story in scenarios outside of Storybook like unit testing.
 *
 * Example:
 *```jsx
 * import { render } from '@testing-library/react';
 * import { composeStory } from '@storybook/react';
 * import Meta, { Primary as PrimaryStory } from './Button.stories';
 *
 * const Primary = composeStory(PrimaryStory, Meta);
 *
 * test('renders primary button with Hello World', () => {
 *   const { getByText } = render(<Primary>Hello world</Primary>);
 *   expect(getByText(/Hello world/i)).not.toBeNull();
 * });
 *```
 *
 * @param story
 * @param componentAnnotations - e.g. (import Meta from './Button.stories')
 * @param [projectAnnotations] - e.g. (import * as projectAnnotations from '../.storybook/preview') this can be applied automatically if you use `setProjectAnnotations` in your setup files.
 * @param [exportsName] - in case your story does not contain a name and you want it to have a name.
 */
export function composeStory<TArgs extends Args = Args>(
  story: ComposedStory<AngularRenderer, TArgs>,
  // componentAnnotations: Meta<TArgs | any>,
  componentAnnotations: Meta<TArgs>,
  projectAnnotations?: ProjectAnnotations<AngularRenderer>,
  exportsName?: string
) {
  return originalComposeStory<AngularRenderer, TArgs>(
    story as ComposedStory<AngularRenderer, Args>,
    componentAnnotations,
    projectAnnotations,
    defaultProjectAnnotations,
    exportsName
  );
}

/**
 * Function that will receive a stories import (e.g. `import * as stories from './Button.stories'`)
 * and optionally projectAnnotations (e.g. `import * from '../.storybook/preview`)
 * and will return an object containing all the stories passed, but now as a composed component that has all args/parameters/decorators/etc combined and applied to it.
 *
 *
 * It's very useful for reusing stories in scenarios outside of Storybook like unit testing.
 *
 * Example:
 *```jsx
 * import { render } from '@testing-library/react';
 * import { composeStories } from '@storybook/react';
 * import * as stories from './Button.stories';
 *
 * const { Primary, Secondary } = composeStories(stories);
 *
 * test('renders primary button with Hello World', () => {
 *   const { getByText } = render(<Primary>Hello world</Primary>);
 *   expect(getByText(/Hello world/i)).not.toBeNull();
 * });
 *```
 *
 * @param csfExports - e.g. (import * as stories from './Button.stories')
 * @param [projectAnnotations] - e.g. (import * as projectAnnotations from '../.storybook/preview') this can be applied automatically if you use `setProjectAnnotations` in your setup files.
 */
export function composeStories<TArgs extends Args, TModule extends Store_CSFExports<AngularRenderer, TArgs> = Store_CSFExports<AngularRenderer, TArgs>>(
  csfExports: TModule,
  projectAnnotations?: ProjectAnnotations<AngularRenderer>
) {
  // @ts-expect-error (Converted from ts-ignore)
  const composedStories = originalComposeStories(csfExports, projectAnnotations, composeStory);

  return composedStories as unknown as Omit<
    StoriesWithPartialProps<AngularRenderer, TModule>,
    keyof Store_CSFExports
  >;
}


interface StoryRenderInfo {
  storyFnAngular: StoryFnAngularReturnType;
  moduleMetadataSnapshot: string;
}

export interface RenderableStoryAndModule {
  component: any;
  applicationConfig: ApplicationConfig;
}

export class SbTestingRenderer {

  protected previousStoryRenderInfo?: StoryRenderInfo;

  // Observable to change the properties dynamically without reloading angular module&component
  public storyProps$: Subject<ICollection | undefined> = new Subject<ICollection | undefined>();

  protected isFirstRender: boolean = true;

  constructor(public storyId: string) { }

  public getRenderableComponent({
    storyFnAngular,
    forced,
    // parameters
    component,
    targetDOMNode,
  }: {
    storyFnAngular: StoryFnAngularReturnType;
    forced: boolean;
    // parameters: Parameters;
    component?: any;
    targetDOMNode: HTMLElement;
  }): {
    component: Type<any> | null;
    applicationConfig: ApplicationConfig;
  } | null {
    const targetSelector = this.generateTargetSelectorFromStoryId(targetDOMNode.id);

    const newStoryProps$ = new BehaviorSubject<ICollection | undefined>(storyFnAngular.props ?? {});

    if (
      !this.fullRendererRequired({
        storyFnAngular,
        moduleMetadata: {
          ...storyFnAngular.moduleMetadata,
        },
        forced,
      })
    ) {
      this.storyProps$.next(storyFnAngular.props);
      this.isFirstRender = false;
      return null;
    }

    if (!this.isFirstRender) {
      return null;
    }

    this.storyProps$ = newStoryProps$;

    const analyzedMetadata = new PropertyExtractor(storyFnAngular.moduleMetadata || {}, component);

    return {
      component: getApplication({
        storyFnAngular,
        component,
        targetSelector,
        analyzedMetadata,
      }),
      applicationConfig: {
        ...storyFnAngular.applicationConfig,
        providers: [
          storyPropsProvider(newStoryProps$),
          ...(analyzedMetadata.applicationProviders ?? []),
          ...(storyFnAngular.applicationConfig?.providers ?? []),
        ],
      }
    };
  }

  public completeStory(): void {
    // Complete last BehaviorSubject and set a new one for the current module
    if (this.storyProps$) {
      this.storyProps$.complete();
    }
  }

  private fullRendererRequired({
    storyFnAngular,
    moduleMetadata,
    forced,
  }: {
    storyFnAngular: StoryFnAngularReturnType;
    moduleMetadata: NgModule;
    forced: boolean;
  }) {
    const { previousStoryRenderInfo } = this;

    const currentStoryRender = {
      storyFnAngular,
      moduleMetadataSnapshot: stringify(moduleMetadata),
    };

    this.previousStoryRenderInfo = currentStoryRender;

    if (
      // check `forceRender` of story RenderContext
      !forced ||
      // if it's the first rendering and storyProps$ is not init
      !this.storyProps$
    ) {
      return true;
    }

    // force the rendering if the template has changed
    const hasChangedTemplate =
      !!storyFnAngular?.template &&
      previousStoryRenderInfo?.storyFnAngular?.template !== storyFnAngular.template;
    if (hasChangedTemplate) {
      return true;
    }

    // force the rendering if the metadata structure has changed
    const hasChangedModuleMetadata =
      currentStoryRender.moduleMetadataSnapshot !== previousStoryRenderInfo?.moduleMetadataSnapshot;

    return hasChangedModuleMetadata;
  }

  /**
   * Only ASCII alphanumerics can be used as HTML tag name.
   * https://html.spec.whatwg.org/#elements-2
   *
   * Therefore, stories break when non-ASCII alphanumerics are included in target selector.
   * https://github.com/storybookjs/storybook/issues/15147
   *
   * This method returns storyId when it doesn't contain any non-ASCII alphanumerics.
   * Otherwise, it generates a valid HTML tag name from storyId by removing non-ASCII alphanumerics from storyId, prefixing "sb-", and suffixing "-component"
   * @protected
   * @memberof AbstractRenderer
   */
  protected generateTargetSelectorFromStoryId(id: string) {
    const invalidHtmlTag = /[^A-Za-z0-9-]/g;
    const storyIdIsInvalidHtmlTagName = invalidHtmlTag.test(id);
    return storyIdIsInvalidHtmlTagName ? `sb-${id.replace(invalidHtmlTag, '')}-component` : id;
  }
}

/**
 * Function that will receive a StoryFnAngularReturnType and will return a Component and NgModule that renders the story.
 * 
 * @param story 
 * @returns 
 */
export function createMountableStoryComponent(storyFnReturn: StoryFnAngularReturnType, component: any): RenderableStoryAndModule {
  const storyId = `storybook-testing-wrapper`;
  const renderer = new SbTestingRenderer(storyId);

  const domNode = document.createElement('span')
  domNode.id = storyId

  const _story: any = {
    ...(storyFnReturn as any),
    moduleMetadata: {
      declarations: [
        ...((storyFnReturn as any).moduleMetadata?.declarations ?? []),
      ],
      imports: [
        ...((storyFnReturn as any).moduleMetadata?.imports ?? []),
      ],
      providers: [
        ...((storyFnReturn as any).moduleMetadata?.providers ?? []),
      ],
      entryComponents: [
        ...((storyFnReturn as any).moduleMetadata?.entryComponents ?? []),
      ],
      schemas: [
        ...((storyFnReturn as any).moduleMetadata?.schemas ?? []),
      ],
    }
  };


  const _module = renderer.getRenderableComponent({
    storyFnAngular: _story,
    forced: false,
    // parameters: {} as any,
    targetDOMNode: domNode,
    component
  });

  // This additional wrapper can probably be avoided by making some changes to
  // the renderer or wrapper component in '@storybook/angular'.
  @Component({
    selector: 'sb-testing-mountable',
    template: `<${storyId}></${storyId}>`,
    imports: [
      (_module as any).component
    ],
    providers: (_module!.applicationConfig.providers as any),
    standalone: true
  })
  class SbTestingMountable implements OnDestroy, AfterViewInit {

    ngOnDestroy(): void {
      renderer.completeStory();
    }

    ngAfterViewInit(): void {
      const domNode = document.createElement('span')
      domNode.id = storyId
      renderer.getRenderableComponent({
        storyFnAngular: storyFnReturn as any,
        forced: false,
        // parameters: {} as any,
        targetDOMNode: domNode,
        component,
      });
    }

  }

  if (_module === null) {
    throw Error(`Must initially have module`);
  }

  return {
    component: SbTestingMountable,
    applicationConfig: _module.applicationConfig
  };
}
