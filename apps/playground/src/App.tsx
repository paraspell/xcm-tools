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
import { ReactiveDotProvider } from '@reactive-dot/react';
import hljs from 'highlight.js/lib/core';
import tsLang from 'highlight.js/lib/languages/typescript';
import { NuqsAdapter } from 'nuqs/adapters/react-router/v7';
import { BrowserRouter } from 'react-router';

import { AppShell } from './components/AppShell/AppShell';
import { WalletProvider } from './providers/WalletProvider';
import { config } from './reactiveDotConfig';
import { theme } from './theme/themeConfig';
hljs.registerLanguage('ts', tsLang);

const highlightJsAdapter = createHighlightJsAdapter(hljs);

const App = () => (
  <BrowserRouter>
    <MantineProvider theme={theme}>
      <NuqsAdapter>
        <CodeHighlightAdapterProvider adapter={highlightJsAdapter}>
          <Notifications />
          <ReactiveDotProvider config={config}>
            <WalletProvider>
              <AppShell />
            </WalletProvider>
          </ReactiveDotProvider>
        </CodeHighlightAdapterProvider>
      </NuqsAdapter>
    </MantineProvider>
  </BrowserRouter>
);

export default App;
