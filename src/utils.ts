import { NgModule } from '@angular/core';
import {
  ICollection,
  StoryFnAngularReturnType
} from '@storybook/angular/dist/ts3.9/client/preview/types';
import { Subject } from 'rxjs'
import { Parameters } from '@storybook/angular/types-6-0';
import { storyPropsProvider } from '@storybook/angular/dist/ts3.9/client/preview/angular-beta/StorybookProvider';
import { isComponentAlreadyDeclaredInModules } from '@storybook/angular/dist/ts3.9/client/preview/angular-beta/utils/NgModulesAnalyzer';
import { isDeclarable } from '@storybook/angular/dist/ts3.9/client/preview/angular-beta/utils/NgComponentAnalyzer';
import { createStorybookWrapperComponent } from '@storybook/angular/dist/ts3.9/client/preview/angular-beta/StorybookWrapperComponent';
import { computesTemplateFromComponent } from '@storybook/angular/dist/ts3.9/client/preview/angular-beta/ComputesTemplateFromComponent';
import { BrowserModule } from '@angular/platform-browser';

const invalidStoryTypes = new Set(['string', 'number', 'boolean', 'symbol']);

export const isInvalidStory = (story?: any) => (!story || Array.isArray(story) || invalidStoryTypes.has(typeof story));

// This can probably be avoided by making changes to this method in `@storybook/angular`.
// Without reimplementing this here:
//   - The ComponentToInject would unnecessarily be added to the NgModule's bootstrap array.
//   - There would be a deprecated warning, because the composed story is currently adding the
//     component from Meta to StoryFnAngularReturnType.
export const getStorybookModuleMetadata = (
  {
    storyFnAngular,
    parameters,
    targetSelector,
  }: {
    storyFnAngular: StoryFnAngularReturnType;
    parameters: Parameters;
    targetSelector: string;
  },
  storyProps$: Subject<ICollection | undefined>
): NgModule => {
  const { component: storyComponent, props, styles, moduleMetadata = {} } = storyFnAngular;
  let { template } = storyFnAngular;

  const component = storyComponent ?? parameters.component;

  if (hasNoTemplate(template) && component) {
    template = computesTemplateFromComponent(component, props, '');
  }

  /**
   * Create a component that wraps generated template and gives it props
   */
  const ComponentToInject = createStorybookWrapperComponent(
    targetSelector,
    template!,
    component,
    styles!,
    props,
  );

  // Look recursively (deep) if the component is not already declared by an import module
  const requiresComponentDeclaration =
    isDeclarable(component) &&
    !isComponentAlreadyDeclaredInModules(
      component,
      moduleMetadata.declarations!,
      moduleMetadata.imports!,
    );

  return {
    declarations: [
      ...(requiresComponentDeclaration ? [component] : []),
      ComponentToInject,
      ...(moduleMetadata.declarations ?? []),
    ],
    imports: [BrowserModule, ...(moduleMetadata.imports ?? [])],
    providers: [
      storyPropsProvider(storyProps$),
      ...(moduleMetadata.providers ?? []),
    ],
    entryComponents: [...(moduleMetadata.entryComponents ?? [])],
    schemas: [...(moduleMetadata.schemas ?? [])],
  };
};

function hasNoTemplate(template: string | null | undefined): template is undefined {
  return template === null || template === undefined;
}
