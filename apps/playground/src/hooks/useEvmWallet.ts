import { useDisclosure } from '@mantine/hooks';
import { ethers } from 'ethers';
import type { InjectedExtension } from 'polkadot-api/pjs-signer';
import {
  connectInjectedExtension,
  getInjectedExtensions,
} from 'polkadot-api/pjs-signer';
import { useCallback, useState } from 'react';

import type { TWalletAccount } from '../types';
import { showErrorNotification } from '../utils/notifications';

export const useEvmWallet = () => {
  const [
    walletSelectModalOpened,
    { open: openWalletSelectModal, close: closeWalletSelectModal },
  ] = useDisclosure(false);
  const [
    accountsModalOpened,
    { open: openAccountsModal, close: closeAccountsModal },
  ] = useDisclosure(false);

  const [extensions, setExtensions] = useState<string[]>([]);
  const [injectedExtension, setInjectedExtension] =
    useState<InjectedExtension>();

  const [accounts, setAccounts] = useState<TWalletAccount[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<TWalletAccount>();

  const onAccountSelect = useCallback(
    (account: TWalletAccount) => {
      setSelectedAccount(account);
      closeAccountsModal();
    },
    [closeAccountsModal],
  );

  const onAccountDisconnect = useCallback(() => {
    setSelectedAccount(undefined);
    setInjectedExtension(undefined);
    closeAccountsModal();
  }, [closeAccountsModal]);

  const initEvmExtensions = useCallback(() => {
    const ext = getInjectedExtensions();
    if (!ext.length) {
      showErrorNotification('No wallet extension found, install it to connect');
      return;
    }
    setExtensions(ext);
    openWalletSelectModal();
  }, [openWalletSelectModal]);

  const onConnectEvmWallet = useCallback(() => {
    try {
      initEvmExtensions();
    } catch (_e) {
      showErrorNotification('Failed to connect EVM wallet');
    }
  }, [initEvmExtensions]);

  const selectProvider = useCallback(
    async (walletName: string) => {
      try {
        const extension = await connectInjectedExtension(walletName);
        setInjectedExtension(extension);

        const allAccounts = extension.getAccounts();
        const evmAccounts = allAccounts.filter((acc) =>
          ethers.isAddress(acc.address),
        );
        if (!evmAccounts.length) {
          showErrorNotification('No EVM accounts found in the selected wallet');
          return;
        }

        setAccounts(
          evmAccounts.map((acc) => ({
            address: acc.address,
            meta: {
              name: acc.name,
              source: extension.name,
            },
          })),
        );

        closeWalletSelectModal();
        openAccountsModal();
      } catch (_e) {
        showErrorNotification('Failed to connect to wallet');
      }
    },
    [closeWalletSelectModal, openAccountsModal],
  );

  const onProviderSelect = useCallback(
    (walletName: string) => {
      void selectProvider(walletName);
    },
    [selectProvider],
  );

  return {
    extensions,
    injectedExtension,
    accounts,
    selectedAccount,
    walletSelectModalOpened,
    accountsModalOpened,
    closeWalletSelectModal,
    closeAccountsModal,
    onConnectEvmWallet,
    onProviderSelect,
    onAccountSelect,
    onAccountDisconnect,
  };
};
