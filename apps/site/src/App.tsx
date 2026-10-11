import "@mantine/core/styles.css";
import "@mantine/code-highlight/styles.css";
import "./App.css";

import {
  CodeHighlightAdapterProvider,
  createHighlightJsAdapter,
} from "@mantine/code-highlight";
import { MantineProvider } from "@mantine/core";
import hljs from "highlight.js/lib/core";
import jsonLang from "highlight.js/lib/languages/json";
import tsLang from "highlight.js/lib/languages/typescript";
import { BrowserRouter } from "react-router";

import { AppShell } from "./components/AppShell/AppShell";
import { MagicClicks } from "./components/Magic/MagicClicks";
import { MagicProvider } from "./components/Magic/MagicProvider";
import { ScrollToLocation } from "./components/ScrollToLocation";
import { cssVariablesResolver, theme } from "./theme";

hljs.registerLanguage("typescript", tsLang);
hljs.registerLanguage("json", jsonLang);

const highlightJsAdapter = createHighlightJsAdapter(hljs);

export const App = () => (
  <BrowserRouter>
    <MantineProvider
      theme={theme}
      defaultColorScheme="auto"
      cssVariablesResolver={cssVariablesResolver}
    >
      <CodeHighlightAdapterProvider adapter={highlightJsAdapter}>
        <MagicProvider>
          <AppShell />
          <ScrollToLocation />
          <MagicClicks />
        </MagicProvider>
      </CodeHighlightAdapterProvider>
    </MantineProvider>
  </BrowserRouter>
);
