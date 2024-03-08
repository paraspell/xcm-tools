import '@mantine/core/styles.css';
import './App.css';
import {
  MantineProvider,
  Image,
  NavLink,
  createTheme,
  MantineColorsTuple,
  Button,
  Modal,
  Stack,
} from '@mantine/core';
import { BrowserRouter, Routes, Route, NavLink as RouterNavLink } from 'react-router-dom';
import RouterTransferPage from './routes/RouterTransferPage';
import { useDisclosure } from '@mantine/hooks';
import { AppShell, Burger, Group } from '@mantine/core';
import { IconHome2 } from '@tabler/icons-react';
import { web3Accounts, web3Enable } from '@polkadot/extension-dapp';
import { InjectedAccountWithMeta } from '@polkadot/extension-inject/types';
import { useState } from 'react';
import { useWallet } from './providers/WalletProvider';
import XcmSdkSandbox from './routes/XcmSdkSandbox';

const myColor: MantineColorsTuple = [
  '#ffe9f6',
  '#ffd1e6',
  '#faa1c9',
  '#f66eab',
  '#f24391',
  '#f02881',
  '#f01879',
  '#d60867',
  '#c0005c',
  '#a9004f',
];

const theme = createTheme({
  primaryColor: 'myColor',
  colors: {
    myColor,
  },
});

const App = () => {
  const [opened, { toggle }] = useDisclosure();
  const [modalOpened, { open: openModal, close: closeModal }] = useDisclosure(false);

  const [accounts, setAccounts] = useState<InjectedAccountWithMeta[]>([]);

  const { selectedAccount, setSelectedAccount } = useWallet();

  const initAccounts = async () => {
    const allInjected = await web3Enable('SpellRouter');

    if (!allInjected) {
      alert('No wallet extension found, install it to connect');
      throw Error('No Wallet Extension Found!');
    }

    const allAccounts = await web3Accounts();
    setAccounts(allAccounts);
  };

  const onConnectWalletClick = async () => {
    await initAccounts();
    openModal();
  };

  const onAccountSelect = (account: InjectedAccountWithMeta) => () => {
    setSelectedAccount(account);
    closeModal();
  };

  const onChangeAccountClick = async () => {
    if (!accounts.length) {
      await initAccounts();
    }
    openModal();
  };

  return (
    <BrowserRouter>
      <MantineProvider theme={theme}>
        <Modal opened={modalOpened} onClose={closeModal} title="Select account" centered>
          <Stack gap="xs">
            {accounts.map((account) => (
              <Button
                size="lg"
                variant="subtle"
                key={account.address}
                onClick={onAccountSelect(account)}
              >
                {`${account.meta.name} (${account.meta.source}) - ${account.address.replace(
                  /(.{10})..+/,
                  '$1…',
                )}`}
              </Button>
            ))}
          </Stack>
        </Modal>
        <AppShell
          header={{ height: 60 }}
          navbar={{ width: 300, breakpoint: 'sm', collapsed: { mobile: !opened } }}
        >
          <AppShell.Header>
            <Group h="100%" px="md" justify="space-between">
              <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" />
              <Image src="logo.png" h="100%" p={8} />
              {selectedAccount ? (
                <Button
                  onClick={onChangeAccountClick}
                  variant="outline"
                >{`${selectedAccount.meta.name} (${selectedAccount.meta.source})`}</Button>
              ) : (
                <Button onClick={onConnectWalletClick}>Connect wallet</Button>
              )}
            </Group>
          </AppShell.Header>
          <AppShell.Navbar p="md">
            <RouterNavLink to="/" style={{ color: 'black' }}>
              {({ isActive }) => (
                <NavLink
                  component="div"
                  active={isActive}
                  label="XCM Router Sandbox"
                  leftSection={<IconHome2 size="1rem" stroke={1.5} />}
                  style={{ borderRadius: 4 }}
                />
              )}
            </RouterNavLink>
            <RouterNavLink to="/xcm-sdk-sandbox" style={{ color: 'black' }}>
              {({ isActive }) => (
                <NavLink
                  component="div"
                  active={isActive}
                  label="XCM SDK Sandbox"
                  leftSection={<IconHome2 size="1rem" stroke={1.5} />}
                  style={{ borderRadius: 4 }}
                />
              )}
            </RouterNavLink>
          </AppShell.Navbar>
          <AppShell.Main>
            <Routes>
              <Route path="/" Component={RouterTransferPage} />
              <Route path="/xcm-sdk-sandbox" Component={XcmSdkSandbox} />
            </Routes>
          </AppShell.Main>
        </AppShell>
      </MantineProvider>
    </BrowserRouter>
  );
};

export default App;
