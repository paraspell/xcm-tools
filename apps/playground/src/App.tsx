import '@mantine/core/styles.css';
import '@mantine/code-highlight/styles.css';
import './App.css';
import { MantineProvider } from '@mantine/core';
import { theme } from './theme/themeConfig';
import { WalletProvider } from './providers/WalletProvider';
import { BrowserRouter } from 'react-router-dom';
import { AppShell } from './components/AppShell/AppShell';

const App = () => (
  <BrowserRouter>
    <MantineProvider theme={theme}>
      <WalletProvider>
        <AppShell />
      </WalletProvider>
    </MantineProvider>
  </BrowserRouter>
);

export default App;
