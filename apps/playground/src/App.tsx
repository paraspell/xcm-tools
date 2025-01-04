import {
  AppShell,
  Burger,
  Button,
  Center,
  Group,
  Image,
  MantineProvider,
  NavLink,
  rem,
  SegmentedControl,
} from "@mantine/core";
import "@mantine/core/styles.css";
import { useDisclosure } from "@mantine/hooks";
import { web3Accounts, web3Enable } from "@polkadot/extension-dapp";
import {
  IconAnalyze,
  IconBoxSeam,
  IconCode,
  IconFileCode,
  IconRoute,
} from "@tabler/icons-react";
import {
  Navigate,
  Route,
  NavLink as RouterNavLink,
  Routes,
  useLocation,
} from "react-router-dom";
import "./App.css";
import { useWallet } from "./hooks/useWallet";
import RouterTransferPage from "./routes/RouterTransferPage";
import XcmAnalyserSandbox from "./routes/XcmAnalyserSandbox";
import XcmSdkSandbox from "./routes/XcmSdkSandbox";
import AccountsModal from "./components/AccountsModal";
import { theme } from "./theme/themeConfig";
import {
  connectInjectedExtension,
  getInjectedExtensions,
} from "polkadot-api/pjs-signer";
import type { TApiType, WalletAccount } from "./types";
import PolkadotWalletSelectModal from "./components/PolkadotWalletSelectModal";
import { STORAGE_ADDRESS_KEY } from "./providers/WalletProvider";
import { useEffect } from "react";

const App = () => {
  const [opened, { toggle }] = useDisclosure();
  const [
    accountsModalOpened,
    { open: openAccountsModal, close: closeAccountsModal },
  ] = useDisclosure(false);
  const [
    walletSelectModalOpened,
    { open: openWalletSelectModal, close: closeWalletSelectModal },
  ] = useDisclosure(false);

  const {
    selectedAccount,
    setSelectedAccount,
    extensions,
    setExtensions,
    setInjectedExtension,
    setExtensionInLocalStorage,
    accounts,
    setAccounts,
    apiType,
    setApiType,
    isInitialized,
  } = useWallet();

  const initPjsAccounts = async () => {
    const allInjected = await web3Enable("Paraspell");

    if (!allInjected.length) {
      alert("No wallet extension found, install it to connect");
      throw Error("No Wallet Extension Found!");
    }

    const allAccounts = await web3Accounts();
    setAccounts(
      allAccounts.map((account) => ({
        address: account.address,
        meta: {
          name: account.meta.name,
          source: account.meta.source,
        },
      })),
    );
    openAccountsModal();
  };

  const initPapiExtensions = () => {
    const extensions: string[] = getInjectedExtensions();

    setExtensions(extensions);
    openWalletSelectModal();
  };

  const initAccounts = async () => {
    if (apiType === "PJS") {
      await initPjsAccounts();
    } else {
      initPapiExtensions();
    }
  };

  const connectWallet = async () => {
    try {
      await initAccounts();
    } catch (_e) {
      alert("Failed to connect wallet");
    }
  };

  const onConnectWalletClick = () => void connectWallet();

  const onAccountSelect = (account: WalletAccount) => {
    setSelectedAccount(account);
    closeAccountsModal();
  };

  const changeAccount = async () => {
    try {
      if (!accounts.length) {
        await initAccounts();
      }
      openAccountsModal();
    } catch (_e) {
      alert("Failed to change account");
    }
  };

  const onChangeAccountClick = () => void changeAccount();

  const location = useLocation();

  useEffect(() => {
    if (location.pathname === "/xcm-router" && apiType === "PAPI") {
      handleApiSwitch("PJS");
    }
  }, [location.pathname, apiType]);

  const handleApiSwitch = (value: string) => {
    setApiType(value as TApiType);
    setSelectedAccount(undefined);
    setAccounts([]);
    setInjectedExtension(undefined);
    setExtensionInLocalStorage(undefined);
    localStorage.removeItem(STORAGE_ADDRESS_KEY);
  };
  const selectWallet = async (walletName: string) => {
    try {
      const selectedExtension = await connectInjectedExtension(walletName);
      setInjectedExtension(selectedExtension);
      setExtensionInLocalStorage(walletName);
      const accounts = selectedExtension.getAccounts();

      if (!accounts.length) {
        alert("No accounts found in the selected wallet");
        throw Error("No accounts found in the selected wallet");
      }

      setAccounts(
        accounts.map((account) => ({
          address: account.address,
          meta: {
            name: account.name,
            source: selectedExtension.name,
          },
        })),
      );
      closeWalletSelectModal();
      openAccountsModal();
    } catch (_e) {
      alert("Failed to connect to wallet");
      closeWalletSelectModal();
    }
  };

  const onWalletSelect = (wallet: string) => void selectWallet(wallet);

  const onDisconnect = () => {
    setSelectedAccount(undefined);
    closeAccountsModal();
  };

  return (
    <MantineProvider theme={theme}>
      <AccountsModal
        isOpen={accountsModalOpened}
        onClose={closeAccountsModal}
        accounts={accounts}
        onAccountSelect={onAccountSelect}
        onDisconnect={selectedAccount ? onDisconnect : undefined}
      />
      <PolkadotWalletSelectModal
        isOpen={walletSelectModalOpened}
        onClose={closeWalletSelectModal}
        providers={extensions}
        onProviderSelect={onWalletSelect}
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
            <Group>
              <Group>
                <SegmentedControl
                  value={apiType}
                  onChange={handleApiSwitch}
                  disabled={!isInitialized}
                  data={[
                    {
                      value: "PJS",
                      label: (
                        <Center style={{ gap: 10 }}>
                          <IconCode
                            style={{ width: rem(16), height: rem(16) }}
                          />
                          <span>PJS</span>
                        </Center>
                      ),
                    },
                    {
                      value: "PAPI",
                      disabled:
                        location.pathname === "/xcm-router" || !isInitialized,
                      label: (
                        <Center style={{ gap: 10 }}>
                          <IconFileCode
                            style={{ width: rem(16), height: rem(16) }}
                          />
                          <span>PAPI</span>
                        </Center>
                      ),
                    },
                  ]}
                />
              </Group>
              {selectedAccount ? (
                <Button
                  onClick={onChangeAccountClick}
                  variant="outline"
                  loading={!isInitialized}
                >{`${selectedAccount.meta.name} - (${selectedAccount.meta.source})`}</Button>
              ) : (
                <Button
                  onClick={onConnectWalletClick}
                  data-testid="btn-connect-wallet"
                  loading={!isInitialized}
                >
                  Connect wallet
                </Button>
              )}
            </Group>
          </Group>
        </AppShell.Header>
        <AppShell.Navbar p="md">
          <RouterNavLink to="/xcm-sdk" style={{ color: "black" }}>
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
          <RouterNavLink to="/xcm-router" style={{ color: "black" }}>
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

          <RouterNavLink to="/xcm-analyser" style={{ color: "black" }}>
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
            <Route path="/" element={<Navigate to="/xcm-sdk" />} />
            <Route path="/xcm-sdk" Component={XcmSdkSandbox} />
            <Route path="/xcm-router" Component={RouterTransferPage} />
            <Route path="/xcm-analyser" Component={XcmAnalyserSandbox} />
          </Routes>
        </AppShell.Main>
      </AppShell>
    </MantineProvider>
  );
};

export default App;
