import '@mantine/core/styles.css';
import '@mantine/code-highlight/styles.css';
import '@mantine/notifications/styles.css';
import './App.css';

import {
  CodeHighlightAdapterProvider,
  createHighlightJsAdapter,
} from '@mantine/code-highlight';
import { MantineProvider, v8CssVariablesResolver } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import hljs from 'highlight.js/lib/core';
import tsLang from 'highlight.js/lib/languages/typescript';
import { NuqsAdapter } from 'nuqs/adapters/react-router/v7';
import { BrowserRouter } from 'react-router';

import { AppShell } from './components/AppShell/AppShell';
import { WalletProvider } from './providers/WalletProvider';
import { theme } from './theme/themeConfig';

hljs.registerLanguage('ts', tsLang);

import '@paraspell/evm';
import '@paraspell/evm-snowbridge';
import '@paraspell/swap';

const highlightJsAdapter = createHighlightJsAdapter(hljs);

export const App = () => (
  <BrowserRouter>
    <MantineProvider
      theme={theme}
      cssVariablesResolver={v8CssVariablesResolver}
    >
      <NuqsAdapter>
        <CodeHighlightAdapterProvider adapter={highlightJsAdapter}>
          <Notifications />
          <WalletProvider>
            <AppShell />
          </WalletProvider>
        </CodeHighlightAdapterProvider>
      </NuqsAdapter>
    </MantineProvider>
  </BrowserRouter>
);
