import {
  AppShell,
  Burger,
  Button,
  Group,
  Image,
  MantineProvider,
  NavLink,
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
import { theme } from "./theme/themeConfig";

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

  const connectWallet = async () => {
    try {
      await initAccounts();
      openModal();
    } catch (error) {
      console.error("Failed to connect wallet:", error);
      alert("Failed to connect wallet");
    }
  };

  const onConnectWalletClick = () => void connectWallet();

  const onAccountSelect = (account: InjectedAccountWithMeta) => () => {
    setSelectedAccount(account);
    closeModal();
  };

  const changeAccount = async () => {
    try {
      if (!accounts.length) {
        await initAccounts();
      }
      openModal();
    } catch (error) {
      console.error("Failed to change account:", error);
      alert("Failed to change account");
    }
  };

  const onChangeAccountClick = () => void changeAccount();

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
                <Button
                  onClick={onConnectWalletClick}
                  data-testid="btn-connect-wallet"
                >
                  Connect wallet
                </Button>
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
