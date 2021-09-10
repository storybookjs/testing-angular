import { AfterViewInit, Component, NgModule, NgZone, OnDestroy, Provider, Type } from '@angular/core';
import addons, { mockChannel } from '@storybook/addons';
import type { Meta, Story, StoryContext, Parameters } from '@storybook/angular';
import { combineParameters, defaultDecorateStory } from '@storybook/client-api';
import { createStorybookModule, getStorybookModuleMetadata } from '@storybook/angular/dist/ts3.9/client/preview/angular-beta/StorybookModule';
import { STORY_PROPS } from '@storybook/angular/dist/ts3.9/client/preview/angular-beta/StorybookProvider';
import { ICollection, StoryFnAngularReturnType } from '@storybook/angular/dist/ts3.9/client/preview/types';
import { BehaviorSubject, Observable, Subject, Subscriber } from 'rxjs';
import { stringify } from 'telejson';


import type { GlobalConfig, StoriesWithPartialProps } from './types';

// Some addons use the channel api to communicate between manager/preview, and this is a client only feature, therefore we must mock it.
addons.setChannel(mockChannel());

let globalStorybookConfig = {};

/** Function that sets the globalConfig of your storybook. The global config is the preview module of your .storybook folder.
 *
 * It should be run a single time, so that your global config (e.g. decorators) is applied to your stories when using `composeStories` or `composeStory`.
 *
 * Example:
 *```jsx
 * // setup.js (for jest)
 * import { setGlobalConfig } from '@storybook/testing-react';
 * import * as globalStorybookConfig from './.storybook/preview';
 *
 * setGlobalConfig(globalStorybookConfig);
 *```
 *
 * @param config - e.g. (import * as globalConfig from '../.storybook/preview')
 */
export function setGlobalConfig(config: GlobalConfig) {
  globalStorybookConfig = config;
}

/**
 * Function that will receive a story along with meta (e.g. a default export from a .stories file)
 * and optionally a globalConfig e.g. (import * from '../.storybook/preview)
 * and will return a composed component that has all args/parameters/decorators/etc combined and applied to it.
 *
 *
 * It's very useful for reusing a story in scenarios outside of Storybook like unit testing.
 *
 * Example:
 *```jsx
 * import { render } from '@testing-library/react';
 * import { composeStory } from '@storybook/testing-react';
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
 * @param meta - e.g. (import Meta from './Button.stories')
 * @param [globalConfig] - e.g. (import * as globalConfig from '../.storybook/preview') this can be applied automatically if you use `setGlobalConfig` in your setup files.
 */
export function composeStory<GenericArgs>(
  story: Story<GenericArgs>,
  meta: Meta,
  globalConfig: GlobalConfig = globalStorybookConfig
) {
  // if (typeof story !== 'function') {
  //   throw new Error(
  //     `Cannot compose story due to invalid format. @storybook/testing-angular expected a function but received ${typeof story} instead.`
  //   );
  // }

  if ((story as any).story !== undefined) {
    throw new Error(
      `StoryFn.story object-style annotation is not supported. @storybook/testing-angular expects hoisted CSF stories.
       https://github.com/storybookjs/storybook/blob/next/MIGRATION.md#hoisted-csf-annotations`
    );
  }

  const finalStoryFn = (context: StoryContext) => {
    const { passArgsFirst = true } = context.parameters;
    if (!passArgsFirst) {
      throw new Error(
        'composeStory does not support legacy style stories (with passArgsFirst = false).'
      );
    }
    return story(
      context.args as GenericArgs,
      context
    ) as StoryFnAngularReturnType;
  }

  const combinedDecorators = [
    ...(story.decorators || []),
    ...(meta?.decorators || []),
    ...(globalConfig?.decorators || []),
  ];

  const decorated = defaultDecorateStory(
    finalStoryFn as any,
    combinedDecorators as any
  );

  const defaultGlobals = Object.entries(
    (globalConfig.globalTypes || {}) as Record<string, { defaultValue: any }>
  ).reduce((acc, [arg, { defaultValue }]) => {
    if (defaultValue) {
      acc[arg] = defaultValue
    }
    return acc
  }, {} as Record<string, { defaultValue: any }>);

  const combinedParameters = combineParameters(
    globalConfig.parameters || {},
    meta.parameters || {},
    story.parameters || {}
  );

  const combinedArgs = {
    ...meta.args,
    ...story.args
  };

  const composedStory = (extraArgs: Record<string, any>) => {
    const config = {
      id: '',
      kind: '',
      name: '',
      argTypes: globalConfig.argTypes || {},
      globals: defaultGlobals,
      parameters: combinedParameters,
      args: {
        ...combinedArgs,
        ...extraArgs,
      },
    };

    return decorated(config);
  };

  composedStory.args = combinedArgs;
  composedStory.decorators = combinedDecorators;
  composedStory.parameters = combinedParameters;

  return composedStory as Story<Partial<GenericArgs>>;
}

/**
 * Function that will receive a stories import (e.g. `import * as stories from './Button.stories'`)
 * and optionally a globalConfig (e.g. `import * from '../.storybook/preview`)
 * and will return an object containing all the stories passed, but now as a composed component that has all args/parameters/decorators/etc combined and applied to it.
 *
 *
 * It's very useful for reusing stories in scenarios outside of Storybook like unit testing.
 *
 * Example:
 *```jsx
 * import { render } from '@testing-library/react';
 * import { composeStories } from '@storybook/testing-react';
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
 * @param storiesImport - e.g. (import * as stories from './Button.stories')
 * @param [globalConfig] - e.g. (import * as globalConfig from '../.storybook/preview') this can be applied automatically if you use `setGlobalConfig` in your setup files.
 */
export function composeStories<
  T extends { default: Meta, __esModule?: boolean }
>(storiesImport: T, globalConfig?: GlobalConfig) {
  const { default: meta, __esModule, ...stories } = storiesImport;

  // Compose an object containing all processed stories passed as parameters
  const composedStories = Object.entries(stories).reduce(
    (storiesMap, [key, story]) => {
      storiesMap[key] = composeStory(story as Story, meta, globalConfig)
      return storiesMap
    },
    {} as { [key: string]: Story }
  );

  return composedStories as StoriesWithPartialProps<T>;
}










interface StoryRenderInfo {
  storyFnAngular: StoryFnAngularReturnType
  moduleMetadataSnapshot: string
}

interface RenderableStoryAndModule {
  component: any
  module: Type<any>
}

export class SbTestingRenderer {

  protected previousStoryRenderInfo?: StoryRenderInfo

  // Observable to change the properties dynamically without reloading angular module&component
  public storyProps$: Subject<ICollection> = new Subject<ICollection>()

  protected isFirstRender: boolean = true

  constructor(public storyId: string) {}

  public getRenderableComponent({
    storyFnAngular,
    forced,
    parameters
  }: {
    storyFnAngular: StoryFnAngularReturnType;
    forced: boolean;
    parameters: Parameters;
  }): Type<any> | null {
    const targetSelector = `${this.storyId}`

    const newStoryProps$ = new BehaviorSubject<ICollection>(storyFnAngular.props ?? {})
    const _moduleMetadata = getStorybookModuleMetadata(
      { storyFnAngular, parameters, targetSelector },
      newStoryProps$
    )
    const moduleMetadata = {
      declarations: [
        ...(_moduleMetadata.declarations ?? [])
      ],
      imports: [
        ...(_moduleMetadata.imports ?? [])
      ],
      providers: [
        ...(_moduleMetadata.providers ?? [])
      ],
      entryComponents: [
        ...(_moduleMetadata.entryComponents ?? [])
      ],
      schemas: [
        ...(_moduleMetadata.schemas ?? [])
      ],
      exports: [
        ...((storyFnAngular.moduleMetadata as any).exports ?? []),
      ],
    }

    if (
      !this.fullRendererRequired({
        storyFnAngular,
        moduleMetadata,
        forced,
      })
    ) {
      this.storyProps$.next(storyFnAngular.props)

      return null
    }

    if (!this.isFirstRender) {
      return null
    }

    this.storyProps$ = newStoryProps$

    return createStorybookModule(moduleMetadata)
  }

  public completeStory(): void {
    // Complete last BehaviorSubject and set a new one for the current module
    if (this.storyProps$) {
      this.storyProps$.complete()
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
    const { previousStoryRenderInfo } = this

    const currentStoryRender = {
      storyFnAngular,
      moduleMetadataSnapshot: stringify(moduleMetadata),
    }

    this.previousStoryRenderInfo = currentStoryRender

    if (
      // check `forceRender` of story RenderContext
      !forced ||
      // if it's the first rendering and storyProps$ is not init
      !this.storyProps$
    ) {
      return true
    }

    // force the rendering if the template has changed
    const hasChangedTemplate =
      !!storyFnAngular?.template &&
      previousStoryRenderInfo?.storyFnAngular?.template !== storyFnAngular.template
    if (hasChangedTemplate) {
      return true
    }

    // force the rendering if the metadata structure has changed
    const hasChangedModuleMetadata =
      currentStoryRender.moduleMetadataSnapshot !== previousStoryRenderInfo?.moduleMetadataSnapshot

    return hasChangedModuleMetadata
  }
}





const _storyPropsProvider = (storyProps$: () => Subject<ICollection | undefined>): Provider => ({
  provide: STORY_PROPS,
  // useFactory: storyDataFactory(storyProps$.asObservable()),
  useFactory: storyDataFactory(storyProps$),
  deps: [NgZone],
})

function storyDataFactory<T>(data: () => Observable<T>) {
  return (ngZone: NgZone) =>
    new Observable((subscriber: Subscriber<T>) => {
      const sub = data().subscribe(
        (v: T) => {
          ngZone.run(() => subscriber.next(v))
        },
        (err) => {
          ngZone.run(() => subscriber.error(err))
        },
        () => {
          ngZone.run(() => subscriber.complete())
        }
      )

      return () => {
        sub.unsubscribe()
      }
    })
}



export function createMountableStoryComponent(story: Story): RenderableStoryAndModule {

  const storyId = 'testing-story'
  const renderer = new SbTestingRenderer(storyId)

  @Component({
    selector: 'sb-testing-mount',
    template: `<${storyId}></${storyId}>`,
    providers: [
      // storyPropsProvider(renderer.storyProps$ as any)
      _storyPropsProvider(() => renderer.storyProps$ as any)
    ],
  })
  class SbTestingMount implements OnDestroy, AfterViewInit {

    ngOnDestroy(): void {
      renderer.completeStory()
    }

    ngAfterViewInit(): void {
      renderer.getRenderableComponent({
        storyFnAngular: story as any,
        forced: false,
        parameters: {} as any,
      })

    }

  }

  const _storyTmp: any = story

  const _story: any = {
    ..._storyTmp,
    moduleMetadata: {
      declarations: [
        ...(_storyTmp.moduleMetadata?.declarations ?? []),
        SbTestingMount
      ],
      imports: [
        ...(_storyTmp.moduleMetadata?.imports ?? [])
      ],
      providers: [
        ...(_storyTmp.moduleMetadata?.providers ?? [])
      ],
      entryComponents: [
        ...(_storyTmp.moduleMetadata?.entryComponents ?? [])
      ],
      schemas: [
        ...(_storyTmp.moduleMetadata?.schemas ?? [])
      ],
      exports: [
        ...(_storyTmp.moduleMetadata?.exports ?? []),
        SbTestingMount
      ],
    }
  }

  const _module = renderer.getRenderableComponent({
    storyFnAngular: _story as any,
    forced: false,
    parameters: {} as any,
  })

  if (_module === null) {
    throw Error(`Must initially have module`)
  }

  return {
    component: SbTestingMount,
    module: _module
  }
}
