import {
  AppShell,
  Burger,
  Button,
  Group,
  Image,
  MantineColorsTuple,
  MantineProvider,
  NavLink,
  createTheme,
} from "@mantine/core";
import "@mantine/core/styles.css";
import { useDisclosure } from "@mantine/hooks";
import { web3Accounts, web3Enable } from "@polkadot/extension-dapp";
import { InjectedAccountWithMeta } from "@polkadot/extension-inject/types";
import { IconAnalyze, IconBoxSeam, IconRoute } from "@tabler/icons-react";
import { useState } from "react";
import {
  BrowserRouter,
  Route,
  NavLink as RouterNavLink,
  Routes,
} from "react-router-dom";
import "./App.css";
import { useWallet } from "./hooks/useWallet";
import RouterTransferPage from "./routes/RouterTransferPage";
import XcmAnalyserSandbox from "./routes/XcmAnalyserSandbox";
import XcmSdkSandbox from "./routes/XcmSdkSandbox";
import AccountsModal from "./components/AccountsModal";

const myColor: MantineColorsTuple = [
  "#ffe9f6",
  "#ffd1e6",
  "#faa1c9",
  "#f66eab",
  "#f24391",
  "#f02881",
  "#f01879",
  "#d60867",
  "#c0005c",
  "#a9004f",
];

const theme = createTheme({
  primaryColor: "myColor",
  colors: {
    myColor,
  },
});

const App = () => {
  const [opened, { toggle }] = useDisclosure();
  const [modalOpened, { open: openModal, close: closeModal }] =
    useDisclosure(false);

  const [accounts, setAccounts] = useState<InjectedAccountWithMeta[]>([]);

  const { selectedAccount, setSelectedAccount } = useWallet();

  const initAccounts = async () => {
    const allInjected = await web3Enable("SpellRouter");

    if (!allInjected) {
      alert("No wallet extension found, install it to connect");
      throw Error("No Wallet Extension Found!");
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
        <AccountsModal
          isOpen={modalOpened}
          onClose={closeModal}
          accounts={accounts}
          onAccountSelect={onAccountSelect}
        />
        <AppShell
          header={{ height: 60 }}
          navbar={{
            width: 300,
            breakpoint: "sm",
            collapsed: { mobile: !opened },
          }}
        >
          <AppShell.Header>
            <Group h="100%" px="md" justify="space-between">
              <Burger
                opened={opened}
                onClick={toggle}
                hiddenFrom="sm"
                size="sm"
              />
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
            <RouterNavLink to="/" style={{ color: "black" }}>
              {({ isActive }) => (
                <NavLink
                  component="div"
                  active={isActive}
                  label="XCM Router Sandbox"
                  leftSection={<IconRoute size="1rem" stroke={1.5} />}
                  style={{ borderRadius: 4 }}
                />
              )}
            </RouterNavLink>
            <RouterNavLink to="/xcm-sdk-sandbox" style={{ color: "black" }}>
              {({ isActive }) => (
                <NavLink
                  component="div"
                  active={isActive}
                  label="XCM SDK Sandbox"
                  leftSection={<IconBoxSeam size="1rem" stroke={1.5} />}
                  style={{ borderRadius: 4 }}
                />
              )}
            </RouterNavLink>
            <RouterNavLink
              to="/xcm-analyser-sandbox"
              style={{ color: "black" }}
            >
              {({ isActive }) => (
                <NavLink
                  component="div"
                  active={isActive}
                  label="XCM Analyser Sandbox"
                  leftSection={<IconAnalyze size="1rem" stroke={1.5} />}
                  style={{ borderRadius: 4 }}
                />
              )}
            </RouterNavLink>
          </AppShell.Navbar>
          <AppShell.Main>
            <Routes>
              <Route path="/" Component={RouterTransferPage} />
              <Route path="/xcm-sdk-sandbox" Component={XcmSdkSandbox} />
              <Route
                path="/xcm-analyser-sandbox"
                Component={XcmAnalyserSandbox}
              />
            </Routes>
          </AppShell.Main>
        </AppShell>
      </MantineProvider>
    </BrowserRouter>
  );
};

export default App;
