import { createFormActions } from '@mantine/form';
import { useDisclosure } from '@mantine/hooks';
import {
  web3Accounts,
  web3Enable,
  web3FromAddress,
  web3FromSource,
} from '@polkadot/extension-dapp';
import { parseAsStringLiteral, useQueryState } from 'nuqs';
import { type InjectedExtension } from 'polkadot-api/pjs-signer';
import type { PropsWithChildren } from 'react';
import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router';

import AccountSelectModal from '../components/AccountSelectModal/AccountSelectModal';
import { PageRoute } from '../components/PageRoute';
import PolkadotWalletSelectModal from '../components/WalletSelectModal/WalletSelectModal';
import { DAPP_NAME, MAIN_FORM_NAME } from '../constants';
import { useReactiveDotWallet } from '../hooks/useReactiveDotWallet';
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
  const {
    walletNames,
    connectWalletByName,
    disconnectWallet,
    getSignerForAddress,
  } = useReactiveDotWallet({
    shouldOpenAccountsModal,
    openAccountsModal,
    closeAccountsModal,
    apiType,
    savedAddressRef,
    selectedAccount,
    setSelectedAccount,
    setAccounts,
  });

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
          const extensions = walletNames;
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

          const didConnect = await connectWalletByName(savedExtensionName);
          if (!didConnect) {
            showErrorNotification('Failed to connect to wallet');
          }
        }
      }
      setIsInitialized(true);
    };

    void initializeFromStorage();
  }, [connectWalletByName, walletNames]);

  useEffect(() => {
    if (apiType === 'PJS' && selectedAccount) {
      void web3Enable(DAPP_NAME);
    }
  }, [selectedAccount, apiType]);

  const getSigner = async () => {
    if (!selectedAccount) {
      throw new Error('No selected account');
    }

    if (apiType === 'PJS') {
      const injector = await web3FromAddress(selectedAccount.address);
      return injector.signer;
    } else {
      return getSignerForAddress(selectedAccount.address, injectedExtension);
    }
  };

  const initPapiExtensions = () => {
    const extensions = walletNames;

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
    disconnectWallet();
    localStorage.removeItem(STORAGE_ADDRESS_KEY);
  };

  const selectPapiWallet = async (walletName: string) => {
    try {
      shouldOpenAccountsModal.current = true;
      const didConnect = await connectWalletByName(walletName);
      if (!didConnect) {
        throw new Error();
      }
      setExtensionInLocalStorage(walletName);
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
    setSelectedAccount(undefined);
    closeAccountsModal();
    disconnectWallet();
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
