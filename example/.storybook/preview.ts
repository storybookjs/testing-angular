// @ts-ignore
// eslint-disable-next-line import/extensions, import/no-unresolved
import { setCompodocJson } from "@storybook/addon-docs/angular";

// @ts-ignore
// eslint-disable-next-line import/extensions, import/no-unresolved
import docJson from "../documentation.json";
setCompodocJson(docJson);

export const parameters = {
  actions: { argTypesRegex: "^on[A-Z].*" },
  controls: {
    matchers: {
      color: /(background|color)$/i,
      date: /Date$/,
    },
  },
  docs: { inlineStories: true },
}
