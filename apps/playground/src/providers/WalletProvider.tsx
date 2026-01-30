import { createFormActions } from '@mantine/form';
import { useDisclosure } from '@mantine/hooks';
import {
  web3Accounts,
  web3Enable,
  web3FromAddress,
  web3FromSource,
} from '@polkadot/extension-dapp';
import type { Wallet } from '@reactive-dot/core/wallets.js';
import {
  useAccounts,
  useWalletConnector,
  useWallets,
} from '@reactive-dot/react';
import { parseAsStringLiteral, useQueryState } from 'nuqs';
import { type InjectedExtension } from 'polkadot-api/pjs-signer';
import type { PropsWithChildren } from 'react';
import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router';

import AccountSelectModal from '../components/AccountSelectModal/AccountSelectModal';
import { PageRoute } from '../components/PageRoute';
import PolkadotWalletSelectModal from '../components/WalletSelectModal/WalletSelectModal';
import { DAPP_NAME, MAIN_FORM_NAME } from '../constants';
import type { TApiType, TWalletAccount } from '../types';
import { showErrorNotification } from '../utils/notifications';
import { WalletContext } from './WalletContext';

const formActions = createFormActions<{
  address: string;
  recipientAddress: string;
}>(MAIN_FORM_NAME);

export const STORAGE_ADDRESS_KEY = 'paraspell_wallet_address';
const STORAGE_API_TYPE_KEY = 'paraspell_api_type';
const STORAGE_EXTENSION_KEY = 'paraspell_connected_extension';

const getAddressFromLocalStorage = (): string | undefined => {
  return localStorage.getItem(STORAGE_ADDRESS_KEY) || undefined;
};

const getApiTypeFromLocalStorage = (): TApiType | undefined => {
  const apiType = localStorage.getItem(STORAGE_API_TYPE_KEY);
  return apiType === 'PJS' || apiType === 'PAPI' ? apiType : undefined;
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

  const [isLoadingExtensions, setIsLoadingExtensions] = useState(false);
  const [queryApiType, setQueryApiType] = useQueryState(
    'apiType',
    parseAsStringLiteral(['PAPI', 'PJS'])
      .withDefault('PAPI')
      .withOptions({ shallow: false }),
  );
  const location = useLocation();
  const isRouter = location.pathname === PageRoute.XCM_ROUTER.toString();
  const selectedApiType = isRouter ? 'PAPI' : queryApiType;

  const [apiType, setApiType] = useState<TApiType>(
    selectedApiType || getApiTypeFromLocalStorage() || DEFAULT_API_TYPE,
  );

  const [extensions, setExtensions] = useState<string[]>([]);
  const [injectedExtension, setInjectedExtension] =
    useState<InjectedExtension>();

  const [accounts, setAccounts] = useState<TWalletAccount[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<
    TWalletAccount | undefined
  >(undefined);

  const [isInitialized, setIsInitialized] = useState(false);

  const [isUseXcmApiSelected, setIsUseXcmApiSelected] = useState(false);

  const dotWallets = useWallets();
  const dotAccounts = useAccounts({ chainId: null });
  const [_, connectDotWallet] = useWalletConnector();
  const [selectedDotWallet, setSelectedDotWallet] = useState<
    Wallet | undefined
  >(undefined);

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

  const savedAddressRef = useRef<string | undefined>(undefined);
  const shouldOpenAccountsModal = useRef<boolean>(false);

  useEffect(() => {
    const initializeFromStorage = async () => {
      const savedApiType = getApiTypeFromLocalStorage();
      const savedAddress = getAddressFromLocalStorage();
      const savedExtensionName = getExtensionFromLocalStorage();

      savedAddressRef.current = savedAddress;
      if (savedApiType && savedAddress) {
        if (savedApiType === 'PJS') {
          const allInjected = await web3Enable('Paraspell');

          if (!allInjected.length) {
            showErrorNotification(
              'No wallet extension found, install it to connect',
            );
            setAccounts([]);
            setSelectedAccount(undefined);
            return;
          }

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
          if (account) {
            setSelectedAccount(account);
          } else {
            setSelectedAccount(undefined);
          }
        } else if (savedApiType === 'PAPI') {
          const extensions = dotWallets.map((wallet) => wallet.name);
          setExtensions(extensions);

          if (!extensions.length) {
            showErrorNotification(
              'No wallet extension found, install it to connect',
            );
            setIsInitialized(true);
            return;
          }

          if (!savedExtensionName || !extensions.includes(savedExtensionName)) {
            showErrorNotification('Previously connected extension not found');
            setAccounts([]);
            setSelectedAccount(undefined);
            setIsInitialized(true);
            return;
          }

          const selectedWallet = dotWallets.find(
            (w) => w.name === savedExtensionName,
          );
          if (selectedWallet) {
            void connectDotWallet(selectedWallet);
            setSelectedDotWallet(selectedWallet);
          }
        }
      }
      setIsInitialized(true);
    };

    void initializeFromStorage();
  }, [dotWallets, connectDotWallet]);

  useEffect(() => {
    if (apiType === 'PJS' && selectedAccount) {
      void web3Enable(DAPP_NAME);
    }
  }, [selectedAccount, apiType]);

  // Convert loaded accounts from reactive-dot accounts to our own account format
  useEffect(() => {
    if (!selectedDotWallet) {
      return;
    }

    const walletAccounts = dotAccounts.filter(
      (account) => account.wallet.name === selectedDotWallet.name,
    );

    if (!walletAccounts.length) {
      if (shouldOpenAccountsModal.current) {
        showErrorNotification('Selected wallet has no accounts');
        shouldOpenAccountsModal.current = false;
      }
      return;
    }

    setAccounts(
      walletAccounts.map((account) => ({
        address: account.address,
        meta: {
          name: account.name,
          source: selectedDotWallet.name,
        },
      })),
    );

    if (shouldOpenAccountsModal.current) {
      openAccountsModal();
      shouldOpenAccountsModal.current = false;
    }
  }, [dotAccounts, selectedDotWallet]);

  // Initialize the selected account from the saved address (local storage)
  useEffect(() => {
    if (apiType !== 'PAPI') {
      return;
    }

    if (!savedAddressRef.current || selectedAccount) {
      return;
    }

    const account = accounts.find(
      (acc) => acc.address === savedAddressRef.current,
    );

    if (!account) {
      return;
    }

    setSelectedAccount(account);
    savedAddressRef.current = undefined;
  }, [accounts, apiType, selectedAccount]);

  const getSigner = async () => {
    if (!selectedAccount) {
      throw new Error('No selected account');
    }

    if (apiType === 'PJS') {
      const injector = await web3FromAddress(selectedAccount.address);
      return injector.signer;
    } else {
      let account = undefined;
      if (injectedExtension) {
        //For special EVM wallet injection in Router
        account = injectedExtension
          .getAccounts()
          .find((account) => account.address === selectedAccount.address);
      } else {
        account = dotAccounts.find(
          (a) => a.address === selectedAccount.address,
        );
      }

      if (!account) {
        throw new Error('No selected account');
      }
      return account.polkadotSigner!;
    }
  };

  const initPapiExtensions = () => {
    const extensions = dotWallets.map((wallet) => wallet.name);

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
    if (apiType === 'PJS') {
      await initPjsExtensions();
    } else {
      initPapiExtensions();
    }
  };

  const connectWallet = async () => {
    try {
      setIsLoadingExtensions(true);
      await initExtensions();
      setIsLoadingExtensions(false);
    } catch (e) {
      showErrorNotification('Failed to connect wallet' + JSON.stringify(e));
    }
  };

  const onAccountSelect = (account: TWalletAccount) => {
    setSelectedDotWallet(
      dotAccounts.find((a) => a.address === account.address)?.wallet as Wallet,
    );
    setSelectedAccount(account);
    // TODO: Will be unified in v13 when xcm-router recipientAddress
    // is renamed to address
    formActions.setFieldValue('address', account.address);
    formActions.setFieldValue('recipientAddress', account.address);
    closeAccountsModal();
  };

  const changeAccount = async () => {
    try {
      if (!accounts.length) {
        await initExtensions();
      }
      openAccountsModal();
    } catch (_e) {
      showErrorNotification('Failed to change account');
    }
  };

  const handleApiSwitch = (value: string) => {
    setApiType(value as TApiType);
    setSelectedAccount(undefined);
    setAccounts([]);
    setInjectedExtension(undefined);
    setExtensionInLocalStorage(undefined);
    setSelectedDotWallet(undefined);
    localStorage.removeItem(STORAGE_ADDRESS_KEY);
  };

  const selectPapiWallet = async (walletName: string) => {
    try {
      const selectedWallet = dotWallets.find((w) => w.name === walletName);

      if (!selectedWallet) {
        throw new Error();
      }

      await connectDotWallet(selectedWallet);
      setSelectedDotWallet(selectedWallet);
      setExtensionInLocalStorage(walletName);
      shouldOpenAccountsModal.current = true;
      closeWalletSelectModal();
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
    shouldOpenAccountsModal.current = false;
    savedAddressRef.current = undefined;
    setSelectedDotWallet(undefined);
    setSelectedAccount(undefined);
    closeAccountsModal();
  };

  return (
    <>
      <AccountSelectModal
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
          setIsUseXcmApiSelected,
          isUseXcmApiSelected,
          isLoadingExtensions,
          isInitialized,
        }}
      >
        {children}
      </WalletContext.Provider>
    </>
  );
};
