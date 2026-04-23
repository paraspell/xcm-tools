import { createFormActions } from '@mantine/form';
import { useDisclosure } from '@mantine/hooks';
import { API_TYPES, type TApiType } from '@paraspell/sdk';
import {
  web3Accounts,
  web3Enable,
  web3FromAddress,
  web3FromSource,
} from '@polkadot/extension-dapp';
import type { EIP6963ProviderDetail } from 'mipd';
import { parseAsStringLiteral, useQueryState } from 'nuqs';
import {
  connectInjectedExtension,
  getInjectedExtensions,
  type InjectedExtension,
} from 'polkadot-api/pjs-signer';
import type { PropsWithChildren } from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router';
import type { Address, Chain, WalletClient } from 'viem';
import { createWalletClient, custom } from 'viem';

import { AccountSelectModal } from '../components/AccountSelectModal/AccountSelectModal';
import { EthWalletSelectModal } from '../components/EthWalletSelectModal';
import { PageRoute } from '../components/PageRoute';
import { PolkadotWalletSelectModal } from '../components/WalletSelectModal/WalletSelectModal';
import { WalletTypeModal } from '../components/WalletSelectModal/WalletTypeModal';
import { DAPP_NAME, MAIN_FORM_NAME } from '../constants';
import type { TWalletAccount, TWalletType } from '../types';
import { requestEip6963Providers } from '../utils';
import { showErrorNotification } from '../utils/notifications';
import { WalletContext } from './WalletContext';

const formActions = createFormActions<{
  recipient: string;
}>(MAIN_FORM_NAME);

export const STORAGE_ADDRESS_KEY = 'paraspell_wallet_address';
const STORAGE_API_TYPE_KEY = 'paraspell_api_type';
const STORAGE_EXTENSION_KEY = 'paraspell_connected_extension';
const STORAGE_EVM_ADDRESS_KEY = 'paraspell_evm_address';
const STORAGE_EVM_PROVIDER_KEY = 'paraspell_evm_provider';

const getAddressFromLocalStorage = (): string | undefined => {
  return localStorage.getItem(STORAGE_ADDRESS_KEY) || undefined;
};

const getApiTypeFromLocalStorage = (): TApiType | undefined => {
  const isApiType = (value: string): value is TApiType =>
    API_TYPES.some((type) => type === value);

  const value = localStorage.getItem(STORAGE_API_TYPE_KEY);
  return value && isApiType(value) ? value : undefined;
};

const getExtensionFromLocalStorage = (): string | undefined => {
  return localStorage.getItem(STORAGE_EXTENSION_KEY) || undefined;
};

const setExtensionInLocalStorage = (extensionName: string | undefined) => {
  if (extensionName) {
    localStorage.setItem(STORAGE_EXTENSION_KEY, extensionName);
  } else {
    localStorage.removeItem(STORAGE_EXTENSION_KEY);
  }
};

const DEFAULT_API_TYPE: TApiType = 'PAPI';

const truncateEvmAddress = (address: string) =>
  `${address.slice(0, 6)}…${address.slice(-4)}`;

export const WalletProvider: React.FC<PropsWithChildren<unknown>> = ({
  children,
}) => {
  const [
    accountsModalOpened,
    { open: openAccountsModal, close: closeAccountsModal },
  ] = useDisclosure(false);
  const [
    walletSelectModalOpened,
    { open: openWalletSelectModal, close: closeWalletSelectModal },
  ] = useDisclosure(false);

  const [
    evmWalletModalOpened,
    { open: openEvmWalletModal, close: closeEvmWalletModal },
  ] = useDisclosure(false);
  const [
    evmAccountsModalOpened,
    { open: openEvmAccountsModal, close: closeEvmAccountsModal },
  ] = useDisclosure(false);

  const [
    walletTypeModalOpened,
    { open: openWalletTypeModal, close: closeWalletTypeModal },
  ] = useDisclosure(false);

  const [isLoadingExtensions, setIsLoadingExtensions] = useState(false);
  const [queryApiType, setQueryApiType] = useQueryState(
    'apiType',
    parseAsStringLiteral(API_TYPES)
      .withDefault('PAPI')
      .withOptions({ shallow: false }),
  );
  const location = useLocation();

  const [apiType, setApiType] = useState<TApiType>(
    queryApiType || getApiTypeFromLocalStorage() || DEFAULT_API_TYPE,
  );

  const [extensions, setExtensions] = useState<string[]>([]);
  const [injectedExtension, setInjectedExtension] =
    useState<InjectedExtension>();

  const [accounts, setAccounts] = useState<TWalletAccount[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<
    TWalletAccount | undefined
  >(undefined);

  const [isInitialized, setIsInitialized] = useState(false);

  const [evmProviders, setEvmProviders] = useState<
    readonly EIP6963ProviderDetail[]
  >([]);
  const [selectedEvmProvider, setSelectedEvmProvider] =
    useState<EIP6963ProviderDetail>();
  const [evmAccounts, setEvmAccounts] = useState<string[]>([]);
  const [selectedEvmAccount, setSelectedEvmAccount] =
    useState<TWalletAccount>();
  const evmProviderRef = useRef<EIP6963ProviderDetail | undefined>(undefined);

  useEffect(() => {
    if (apiType) {
      localStorage.setItem(STORAGE_API_TYPE_KEY, apiType);
      if (location.pathname === PageRoute.DEFAULT) {
        return;
      }
      void setQueryApiType(apiType);
    }
  }, [apiType, setQueryApiType, location.pathname]);

  useEffect(() => {
    if (!isInitialized) return;

    if (selectedAccount) {
      localStorage.setItem(STORAGE_ADDRESS_KEY, selectedAccount.address);
    } else {
      localStorage.removeItem(STORAGE_ADDRESS_KEY);
    }
  }, [selectedAccount]);

  useEffect(() => {
    if (!isInitialized) return;

    if (selectedEvmAccount) {
      localStorage.setItem(STORAGE_EVM_ADDRESS_KEY, selectedEvmAccount.address);
    } else {
      localStorage.removeItem(STORAGE_EVM_ADDRESS_KEY);
    }
  }, [selectedEvmAccount, isInitialized]);

  useEffect(() => {
    evmProviderRef.current = selectedEvmProvider;

    if (!isInitialized) return;

    if (selectedEvmProvider) {
      localStorage.setItem(
        STORAGE_EVM_PROVIDER_KEY,
        selectedEvmProvider.info.rdns,
      );
    } else {
      localStorage.removeItem(STORAGE_EVM_PROVIDER_KEY);
    }
  }, [selectedEvmProvider, isInitialized]);

  useEffect(() => {
    const provider = selectedEvmProvider?.provider;
    if (!provider) return;

    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length === 0) {
        setSelectedEvmAccount(undefined);
        setEvmAccounts([]);
        setSelectedEvmProvider(undefined);
      } else {
        setEvmAccounts(accounts);
        setSelectedEvmAccount((current) => {
          if (current && accounts.includes(current.address)) {
            return current;
          }
          return {
            address: accounts[0],
            meta: {
              name: truncateEvmAddress(accounts[0]),
              source: selectedEvmProvider?.info.name,
            },
          };
        });
      }
    };

    provider.on('accountsChanged', handleAccountsChanged);
    return () => {
      provider.removeListener('accountsChanged', handleAccountsChanged);
    };
  }, [selectedEvmProvider]);

  useEffect(() => {
    const initializeFromStorage = async () => {
      const savedApiType = getApiTypeFromLocalStorage();
      const savedAddress = getAddressFromLocalStorage();
      const savedExtensionName = getExtensionFromLocalStorage();

      if (savedApiType) {
        setApiType(savedApiType);
      }

      if (savedApiType && savedAddress) {
        if (savedApiType === 'PJS' || savedApiType === 'DEDOT') {
          const allInjected = await web3Enable('Paraspell');

          if (!allInjected.length) {
            showErrorNotification(
              'No wallet extension found, install it to connect',
            );
            setAccounts([]);
            setSelectedAccount(undefined);
          } else {
            const allAccounts = await web3Accounts();
            const walletAccounts = allAccounts.map((account) => ({
              address: account.address,
              meta: {
                name: account.meta.name,
                source: account.meta.source,
              },
            }));
            setAccounts(walletAccounts);

            const account = walletAccounts.find(
              (acc) => acc.address === savedAddress,
            );
            setSelectedAccount(account ?? undefined);
          }
        } else if (savedApiType === 'PAPI') {
          const extensions = getInjectedExtensions();
          setExtensions(extensions);

          if (!extensions.length) {
            showErrorNotification(
              'No wallet extension found, install it to connect',
            );
            setAccounts([]);
            setSelectedAccount(undefined);
          } else if (
            !savedExtensionName ||
            !extensions.includes(savedExtensionName)
          ) {
            showErrorNotification('Previously connected extension not found');
            setAccounts([]);
            setSelectedAccount(undefined);
            setIsLoadingExtensions(false);
          } else {
            const selectedExtension =
              await connectInjectedExtension(savedExtensionName);
            setInjectedExtension(selectedExtension);

            const accounts = selectedExtension.getAccounts();

            const walletAccounts = accounts.map((account) => ({
              address: account.address,
              meta: {
                name: account.name,
                source: selectedExtension.name,
              },
            }));
            setAccounts(walletAccounts);

            const account = walletAccounts.find(
              (acc) => acc.address === savedAddress,
            );
            setSelectedAccount(account ?? undefined);
          }
        }
      }

      await initializeEvmFromStorage();
      setIsInitialized(true);
    };

    const initializeEvmFromStorage = async () => {
      const savedEvmAddress = localStorage.getItem(STORAGE_EVM_ADDRESS_KEY);
      const savedEvmProviderRdns = localStorage.getItem(
        STORAGE_EVM_PROVIDER_KEY,
      );

      if (!savedEvmAddress || !savedEvmProviderRdns) return;

      try {
        const providers = requestEip6963Providers();
        const provider = providers.find(
          (p) => p.info.rdns === savedEvmProviderRdns,
        );

        if (!provider) return;

        const currentAccounts = await provider.provider.request({
          method: 'eth_accounts',
        });

        if (!currentAccounts.includes(savedEvmAddress as Address)) return;

        setSelectedEvmProvider(provider);
        setEvmAccounts(currentAccounts);
        setSelectedEvmAccount({
          address: savedEvmAddress,
          meta: {
            name: truncateEvmAddress(savedEvmAddress),
            source: provider.info.name,
          },
        });
      } catch {
        // silently ignore - user can reconnect manually
      }
    };

    void initializeFromStorage();
  }, []);

  useEffect(() => {
    if ((apiType === 'PJS' || apiType === 'DEDOT') && selectedAccount) {
      void web3Enable(DAPP_NAME);
    }
  }, [selectedAccount, apiType]);

  const getSigner = async () => {
    if (!selectedAccount) {
      throw new Error('No selected account');
    }

    if (apiType === 'PJS' || apiType === 'DEDOT') {
      const injector = await web3FromAddress(selectedAccount.address);
      return injector.signer;
    } else {
      const account = injectedExtension
        ?.getAccounts()
        .find((account) => account.address === selectedAccount.address);
      if (!account) {
        throw new Error('No selected account');
      }
      return account.polkadotSigner;
    }
  };

  const initPapiExtensions = () => {
    const extensions = getInjectedExtensions();

    if (!extensions.length) {
      showErrorNotification('No wallet extension found, install it to connect');
      throw Error('No Wallet Extension Found!');
    }

    setExtensions(extensions);
    openWalletSelectModal();
  };

  const initPjsExtensions = async () => {
    const extensions = await web3Enable(DAPP_NAME);

    if (!extensions.length) {
      showErrorNotification('No wallet extension found, install it to connect');
      throw Error('No Wallet Extension Found!');
    }

    setExtensions(extensions.map((extension) => extension.name));
    openWalletSelectModal();
  };

  const initExtensions = async () => {
    if (apiType === 'PJS' || apiType === 'DEDOT') {
      await initPjsExtensions();
    } else {
      initPapiExtensions();
    }
  };

  const clearEvmState = () => {
    setSelectedEvmAccount(undefined);
    setEvmAccounts([]);
    setSelectedEvmProvider(undefined);
    closeEvmAccountsModal();
    closeEvmWalletModal();
  };

  const clearSubstrateState = () => {
    setSelectedAccount(undefined);
    setAccounts([]);
    setInjectedExtension(undefined);
    setExtensionInLocalStorage(undefined);
    localStorage.removeItem(STORAGE_ADDRESS_KEY);
    closeAccountsModal();
    closeWalletSelectModal();
  };

  const connectSubstrateWallet = async () => {
    try {
      clearEvmState();
      setIsLoadingExtensions(true);
      await initExtensions();
      setIsLoadingExtensions(false);
    } catch (e) {
      showErrorNotification('Failed to connect wallet' + JSON.stringify(e));
    }
  };

  const connectWallet = () => {
    openWalletTypeModal();
    return Promise.resolve();
  };

  const onAccountSelect = (account: TWalletAccount) => {
    setSelectedAccount(account);
    formActions.setFieldValue('recipient', account.address);
    closeAccountsModal();
  };

  const changeAccount = async () => {
    try {
      if (selectedEvmAccount) {
        if (!evmAccounts.length) {
          triggerEvmConnect();
        } else {
          openEvmAccountsModal();
        }
        return;
      }
      if (!accounts.length) {
        await initExtensions();
      }
      openAccountsModal();
    } catch (_e) {
      showErrorNotification('Failed to change account');
    }
  };

  const triggerEvmConnect = () => {
    try {
      clearSubstrateState();
      const providers = requestEip6963Providers();

      if (providers.length === 0) {
        showErrorNotification('No compatible Ethereum wallets found.');
        return;
      }

      setEvmProviders(providers);
      openEvmWalletModal();
    } catch (_e) {
      showErrorNotification(
        'An error occurred while fetching wallet providers.',
      );
    }
  };

  const onWalletTypeSelect = (type: TWalletType) => {
    closeWalletTypeModal();
    if (type === 'substrate') {
      void connectSubstrateWallet();
    } else {
      triggerEvmConnect();
    }
  };

  const handleApiSwitch = (value: string) => {
    setApiType(value as TApiType);
    setSelectedAccount(undefined);
    setAccounts([]);
    setInjectedExtension(undefined);
    setExtensionInLocalStorage(undefined);
    localStorage.removeItem(STORAGE_ADDRESS_KEY);
  };

  const selectPapiWallet = async (walletName: string) => {
    try {
      const selectedExtension = await connectInjectedExtension(walletName);
      setInjectedExtension(selectedExtension);
      setExtensionInLocalStorage(walletName);
      const accounts = selectedExtension.getAccounts();

      if (!accounts.length) {
        showErrorNotification('No accounts found in the selected wallet');
        throw Error('No accounts found in the selected wallet');
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
      showErrorNotification('Failed to connect to wallet');
      closeWalletSelectModal();
    }
  };

  const selectPjsWallet = async (walletName: string) => {
    try {
      const extension = await web3FromSource(walletName);

      const accounts = await extension.accounts.get();

      setAccounts(
        accounts.map((account) => ({
          address: account.address,
          meta: {
            name: account.name,
            source: extension.name,
          },
        })),
      );
      closeWalletSelectModal();
      openAccountsModal();
    } catch (_e) {
      showErrorNotification('Failed to connect to wallet');
    }
  };

  const onWalletSelect = (wallet: string) => {
    return apiType === 'PAPI'
      ? void selectPapiWallet(wallet)
      : void selectPjsWallet(wallet);
  };

  const onDisconnect = () => {
    setSelectedAccount(undefined);
    closeAccountsModal();
  };

  const onEvmProviderSelect = (providerInfo: EIP6963ProviderDetail) => {
    const run = async () => {
      try {
        closeEvmWalletModal();
        const provider = providerInfo.provider;
        if (!provider) {
          showErrorNotification('Selected provider is not available.');
          return;
        }

        const accounts = await provider.request({
          method: 'eth_requestAccounts',
        });

        if (accounts.length === 0) {
          showErrorNotification('No accounts found in the selected wallet.');
          return;
        }

        setSelectedEvmProvider(providerInfo);
        setEvmAccounts(accounts);
        openEvmAccountsModal();
      } catch (_e) {
        showErrorNotification(
          'An error occurred while connecting to the wallet.',
        );
      }
    };
    void run();
  };

  const onEvmAccountSelect = (account: TWalletAccount) => {
    setSelectedEvmAccount(account);
    closeEvmAccountsModal();
    formActions.setFieldValue('recipient', account.address);
  };

  const disconnectEvmWallet = () => {
    clearEvmState();
  };

  const onChangeWalletType = () => {
    closeAccountsModal();
    closeEvmAccountsModal();
    openWalletTypeModal();
  };

  const evmAccountsList: TWalletAccount[] = evmAccounts.map((address) => ({
    address,
    meta: {
      name: truncateEvmAddress(address),
      source: selectedEvmProvider?.info.name,
    },
  }));

  const getEvmWalletClient = useCallback(
    (chain: Chain): WalletClient | undefined => {
      const provider = evmProviderRef.current?.provider;
      if (!provider || !selectedEvmAccount) return undefined;

      return createWalletClient({
        account: selectedEvmAccount.address as Address,
        transport: custom(provider),
        chain,
      });
    },
    [selectedEvmAccount],
  );

  return (
    <>
      <WalletTypeModal
        isOpen={walletTypeModalOpened}
        onClose={closeWalletTypeModal}
        onSelect={onWalletTypeSelect}
      />
      <AccountSelectModal
        isOpen={accountsModalOpened}
        onClose={closeAccountsModal}
        accounts={accounts}
        onAccountSelect={onAccountSelect}
        onDisconnect={selectedAccount ? onDisconnect : undefined}
        onChangeWalletType={onChangeWalletType}
      />
      <PolkadotWalletSelectModal
        isOpen={walletSelectModalOpened}
        onClose={closeWalletSelectModal}
        providers={extensions}
        onProviderSelect={onWalletSelect}
      />
      <EthWalletSelectModal
        isOpen={evmWalletModalOpened}
        onClose={closeEvmWalletModal}
        providers={evmProviders}
        onProviderSelect={onEvmProviderSelect}
        onDisconnect={selectedEvmAccount ? disconnectEvmWallet : undefined}
      />
      <AccountSelectModal
        isOpen={evmAccountsModalOpened}
        onClose={closeEvmAccountsModal}
        accounts={evmAccountsList}
        onAccountSelect={onEvmAccountSelect}
        onDisconnect={selectedEvmAccount ? disconnectEvmWallet : undefined}
        onChangeWalletType={onChangeWalletType}
        title="Select Ethereum account"
      />
      <WalletContext.Provider
        value={{
          apiType,
          setApiType,
          extensions,
          setExtensions,
          injectedExtension,
          setInjectedExtension,
          setExtensionInLocalStorage,
          selectedAccount,
          setSelectedAccount,
          accounts,
          setAccounts,
          getSigner,
          connectWallet,
          changeAccount,
          handleApiSwitch,

          isLoadingExtensions,
          isInitialized,

          selectedEvmAccount,
          selectedEvmProvider,
          getEvmWalletClient,
          disconnectEvmWallet,
        }}
      >
        {children}
      </WalletContext.Provider>
    </>
  );
};
