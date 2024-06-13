<p align="center">
  <img src="https://user-images.githubusercontent.com/1671563/132940423-c8e09cff-7b08-4d35-bdcd-0f1263063f7b.png" alt="Storybook Testing Angular" width="100" />
</p>

<p align="center">Testing utilities that allow you to reuse your stories in your unit tests</p>

<br/>

## The problem

You are using [Storybook](https://storybook.js.org/) for your components and writing tests for them with [Jasmine test framework](https://jasmine.github.io/) or [Angular testing library](https://testing-library.com/), most likely with [Karma test runner](https://karma-runner.github.io/). In your Storybook stories, you already defined the scenarios of your components. You also set up the necessary decorators (theming, routing, state management, etc.) to make them all render correctly. When you're writing tests, you also end up defining scenarios of your components, as well as setting up the necessary decorators. By doing the same thing twice, you feel like you're spending too much effort, making writing and maintaining stories/tests become less like fun and more like a burden.

## The solution

`@storybook/testing-angular` is a solution to reuse your Storybook stories in your Angular tests. By reusing your stories in your tests, you have a catalog of component scenarios ready to be tested. All [args](https://storybook.js.org/docs/angular/writing-stories/args) and [decorators](https://storybook.js.org/docs/angular/writing-stories/decorators) from your [story](https://storybook.js.org/docs/angular/api/csf#named-story-exports) and its [meta](https://storybook.js.org/docs/angular/api/csf#default-export), and also [global decorators](https://storybook.js.org/docs/angular/writing-stories/decorators#global-decorators), will be composed by this library and returned to you in a simple component. This way, in your unit tests, all you have to do is select which story you want to render, and all the necessary setup will be already done for you. This is the missing piece that allows for better shareability and maintenance between writing tests and writing Storybook stories.

## Installation

This library should be installed as one of your project's `devDependencies`:

via [npm](https://www.npmjs.com/)

<!-- ```
npm install --save-dev @storybook/testing-angular
```

or via [yarn](https://classic.yarnpkg.com/)

```
yarn add --dev @storybook/testing-angular
``` -->

## Setup

### Storybook 7 and Component Story Format

This library requires you to be using Storybook version 7, [Component Story Format (CSF)](https://storybook.js.org/docs/angular/api/csf) and [hoisted CSF annotations](https://github.com/storybookjs/storybook/blob/next/MIGRATION.md#hoisted-csf-annotations), which is the recommended way to write stories since Storybook 7.

Essentially, if you use Storybook 7 and your stories look similar to this, you're good to go!

```ts
// CSF: default export (meta) + named exports (stories)
export default {
  title: 'Example/Button',
  component: Button,
} as Meta;

const Primary: Story<ButtonComponent> = args => (args: ButtonComponent) => ({
  props: args,
}); // or with Template.bind({})
Primary.args = {
  primary: true,
};
```

### Global config

> This is an optional step. If you don't have [global decorators](https://storybook.js.org/docs/angular/writing-stories/decorators#global-decorators), there's no need to do this. However, if you do, this is a necessary step for your global decorators to be applied.

If you have global decorators/parameters/etc and want them applied to your stories when testing them, you first need to set this up. You can do this by adding to test [setup file](https://angular.io/guide/testing#configuration):

```ts
// test.ts <-- this will run before the tests in karma.
import { setProjectAnnotations } from '@storybook/testing-angular';
import * as globalStorybookConfig from '../.storybook/preview'; // path of your preview.js file

setProjectAnnotations(globalStorybookConfig);
```

## Usage

### `composeStories`

`composeStories` will process all stories from the component you specify, compose args/decorators in all of them and return an object containing the composed stories.

If you use the composed story (e.g. PrimaryButton), the component will render with the args that are passed in the story. However, you are free to pass any props on top of the component, and those props will override the default values passed in the story's args.

```ts
import { render, screen } from '@testing-library/angular';
import {
  composeStories,
  createMountable,
} from '@storybook/testing-angular';
import * as stories from './button.stories'; // import all stories from the stories file
import Meta from './button.stories';

// Every component that is returned maps 1:1 with the stories, but they already contain all decorators from story level, meta level and global level.
const { Primary, Secondary } = composeStories(stories);

describe('button', () => {
  it('renders primary button with default args', async () => {
    const { component, applicationConfig } = createMountable(
      Primary({})
    );
    await render(component, { providers: applicationConfig.providers });
    const buttonElement = screen.getByText(
      /Text coming from args in stories file!/i
    );
    expect(buttonElement).not.toBeNull();
  });

  it('renders primary button with overriden props', async () => {
    const { component, applicationConfig } = createMountable(
      Primary({ label: 'Hello world' })
    ); // you can override props and they will get merged with values from the Story's args
    await render(component, { providers: applicationConfig.providers });
    const buttonElement = screen.getByText(/Hello world/i);
    expect(buttonElement).not.toBeNull();
  });
});
```

### `composeStory`

You can use `composeStory` if you wish to apply it for a single story rather than all of your stories. You need to pass the meta (default export) as well.

```ts
import { render, screen } from '@testing-library/angular';
import {
  composeStory,
  createMountable,
} from '@storybook/testing-angular';
import Meta, { Primary as PrimaryStory } from './button.stories';

// Returns a component that already contain all decorators from story level, meta level and global level.
const Primary = composeStory(PrimaryStory, Meta);

describe('button', () => {
  it('onclick handler is called', async () => {
    const onClickSpy = jasmine.createSpy();
    const { component, applicationConfig } = createMountable(
      Primary({ onClick: onClickSpy })
    );
    await render(component, { provider: applicationConfig.provider });
    const buttonElement = screen.getByText(Primary.args?.label!);
    buttonElement.click();
    expect(onClickSpy).toHaveBeenCalled();
  });
});
```

### Reusing story properties

The components returned by `composeStories` or `composeStory` not only can be rendered as Angular components, but also come with the combined properties from story, meta and global configuration. This means that if you want to access `args` or `parameters`, for instance, you can do so:

```ts
import { render, screen } from '@testing-library/angular';
import {
  composeStory,
  createMountable,
} from '@storybook/testing-angular';
import * as stories from './button.stories';
import Meta from './button.stories';

const { Primary } = composeStories(stories);

describe('button', () => {
  it('reuses args from composed story', async () => {
    const { component, applicationConfig } = createMountable(Primary({}));
    await render(component, { providers: applicationConfig.providers });
    expect(screen.getByText(Primary.args?.label!)).not.toBeNull();
  });
});
```

> **If you're using Typescript**: Given that some of the returned properties are not required, typescript might perceive them as nullable properties and present an error. If you are sure that they exist (e.g. certain arg that is set in the story), you can use the [non-null assertion operator](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-2-0.html#non-null-assertion-operator) to tell typescript that it's all good:

```tsx
// ERROR: Object is possibly 'undefined'
Primary.args.children;

// SUCCESS: 🎉
Primary.args!.children;
```

## Typescript

`@storybook/testing-angular` is typescript ready and provides autocompletion to easily detect all stories of your component:

![component autocompletion](https://user-images.githubusercontent.com/1671563/111436219-034d1600-8702-11eb-82bb-36913b235787.png)

It also provides the props of the components just as you would normally expect when using them directly in your tests:

![props autocompletion](https://user-images.githubusercontent.com/1671563/111436252-0d6f1480-8702-11eb-8186-0102863f66f1.png)

Type inference is only possible in projects that have either `strict` or `strictBindApplyCall` modes set to `true` in their `tsconfig.json` file. You also need a TypeScript version over 4.0.0. If you don't have proper type inference, this might be the reason.

```jsonc
// tsconfig.json
{
  "compilerOptions": {
    // ...
    "strict": true, // You need either this option
    "strictBindCallApply": true // or this option
    // ...
  }
  // ...
}
```

### Disclaimer

For the types to be automatically picked up, your stories must be typed. See an example:

```ts
import { Story, Meta } from '@storybook/angular';

import { ButtonComponent } from './button.component';

export default {
  title: 'Components/Button',
  component: ButtonComponent,
} as Meta;

// Story<Props> is the key piece needed for typescript validation
const Template: Story<ButtonComponent> = (args: ButtonComponent) => ({
  props: args,
});

export const Primary = Template.bind({});
Primary.args = {
  primary: true,
  label: 'Button',
};
```

## License

[MIT](./LICENSE)
