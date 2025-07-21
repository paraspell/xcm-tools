import "@mantine/core/styles.css";
import "@mantine/code-highlight/styles.css";
import "./App.css";

import {
  CodeHighlightAdapterProvider,
  createHighlightJsAdapter,
} from "@mantine/code-highlight";
import { MantineProvider } from "@mantine/core";
import hljs from "highlight.js/lib/core";
import tsLang from "highlight.js/lib/languages/typescript";
import { BrowserRouter } from "react-router-dom";

import AppShell from "./components/AppShell/AppShell";
import ScrollToAnchor from "./components/ScrollToAnchor";
import { theme } from "./theme";

hljs.registerLanguage("typescript", tsLang);

const highlightJsAdapter = createHighlightJsAdapter(hljs);

const App = () => (
  <BrowserRouter>
    <MantineProvider theme={theme} forceColorScheme="light">
      <CodeHighlightAdapterProvider adapter={highlightJsAdapter}>
        <AppShell />
        <ScrollToAnchor />
      </CodeHighlightAdapterProvider>
    </MantineProvider>
  </BrowserRouter>
);

export default App;
