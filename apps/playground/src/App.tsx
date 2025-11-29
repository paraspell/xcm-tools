import '@mantine/core/styles.css';
import '@mantine/code-highlight/styles.css';
import '@mantine/notifications/styles.css';
import './App.css';

import {
  CodeHighlightAdapterProvider,
  createHighlightJsAdapter,
} from '@mantine/code-highlight';
import { MantineProvider } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import hljs from 'highlight.js/lib/core';
import tsLang from 'highlight.js/lib/languages/typescript';
import { BrowserRouter } from 'react-router-dom';

import { AppShell } from './components/AppShell/AppShell';
import SelectedApiTypeProvider from './providers/SelectedApiType/SelectedApiTypeProvider';
import { WalletProvider } from './providers/WalletProvider';
import { theme } from './theme/themeConfig';

hljs.registerLanguage('ts', tsLang);

const highlightJsAdapter = createHighlightJsAdapter(hljs);

const App = () => (
  <BrowserRouter>
    <MantineProvider theme={theme}>
      <SelectedApiTypeProvider>
        <CodeHighlightAdapterProvider adapter={highlightJsAdapter}>
          <Notifications />
          <WalletProvider>
            <AppShell />
          </WalletProvider>
        </CodeHighlightAdapterProvider>
      </SelectedApiTypeProvider>
    </MantineProvider>
  </BrowserRouter>
);

export default App;
