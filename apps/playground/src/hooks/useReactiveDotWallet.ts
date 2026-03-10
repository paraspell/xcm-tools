import type { Wallet } from '@reactive-dot/core/wallets.js';
import {
  useAccounts,
  useWalletConnector,
  useWallets,
} from '@reactive-dot/react';
import type { PolkadotSigner } from 'polkadot-api';
import type { InjectedExtension } from 'polkadot-api/pjs-signer';
import type { RefObject } from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';

import type { TApiType, TDotAccount, TWalletAccount } from '../types';
import { showErrorNotification } from '../utils/notifications';
import type { ChainSpecData } from './useLedgerChainSpec';

const LEDGER_WALLET_NAME = 'Ledger';

type UseReactiveDotWalletParams = {
  shouldOpenAccountsModal: RefObject<boolean>;
  openAccountsModal: () => void;
  closeAccountsModal: () => void;
  apiType?: TApiType;
  savedAddressRef?: RefObject<string | undefined>;
  selectedAccount?: TWalletAccount;
  setSelectedAccount?: (account: TWalletAccount | undefined) => void;
  setAccounts?: (accounts: TWalletAccount[]) => void;
  ledgerChainSpec?: ChainSpecData;
};

type UseReactiveDotWalletResult = {
  walletNames: string[];
  selectedWalletName: string | undefined;
  connectWalletByName: (walletName: string) => Promise<boolean>;
  disconnectWallet: () => void;
  accounts: TWalletAccount[];
  getSignerForAddress: (
    address: string,
    injectedExtension?: InjectedExtension,
  ) => PolkadotSigner;
};

function toWalletAccounts(
  dotAccounts: TDotAccount[],
  walletName: string,
): TWalletAccount[] {
  return dotAccounts
    .filter((a) => a.wallet.name === walletName)
    .map((a) => ({
      address: a.address,
      meta: { name: a.name, source: walletName },
    }));
}

export const useReactiveDotWallet = ({
  shouldOpenAccountsModal,
  openAccountsModal,
  closeAccountsModal,
  apiType,
  savedAddressRef,
  selectedAccount,
  setSelectedAccount,
  setAccounts,
  ledgerChainSpec,
}: UseReactiveDotWalletParams): UseReactiveDotWalletResult => {
  const wallets = useWallets();
  const dotAccountsBase = useAccounts({ chainId: null });
  const dotAccountsLedger = useAccounts({
    chainSpec: ledgerChainSpec,
  });
  const [, connectWallet] = useWalletConnector();
  const [selectedWalletName, setSelectedWalletName] = useState<
    string | undefined
  >(undefined);

  const walletNames = useMemo(
    () => wallets.map((wallet: Wallet) => wallet.name),
    [wallets],
  );

  const selectedWallet = useMemo(
    () => wallets.find((wallet: Wallet) => wallet.name === selectedWalletName),
    [selectedWalletName, wallets],
  );

  const isLedgerSelected = selectedWallet?.name === LEDGER_WALLET_NAME;
  const dotAccounts = useMemo(
    () => (isLedgerSelected ? dotAccountsLedger : dotAccountsBase),
    [isLedgerSelected, dotAccountsBase, dotAccountsLedger],
  );

  const accounts = useMemo<TWalletAccount[]>(() => {
    if (!selectedWallet) return [];
    return toWalletAccounts(dotAccounts as TDotAccount[], selectedWallet.name);
  }, [dotAccounts, selectedWallet]);

  useEffect(() => {
    if (!selectedWallet) return;
    if (isLedgerSelected && !ledgerChainSpec) {
      if (shouldOpenAccountsModal.current)
        shouldOpenAccountsModal.current = false;
      return;
    }
    if (!accounts.length) {
      if (shouldOpenAccountsModal.current) {
        if (isLedgerSelected && ledgerChainSpec) {
          showErrorNotification('Ledger accounts could not be loaded');
        } else if (!isLedgerSelected) {
          showErrorNotification('Selected wallet has no accounts');
        }
        shouldOpenAccountsModal.current = false;
      }
      return;
    }
    if (shouldOpenAccountsModal.current) {
      openAccountsModal();
      shouldOpenAccountsModal.current = false;
    }
  }, [
    accounts,
    isLedgerSelected,
    ledgerChainSpec,
    openAccountsModal,
    selectedWallet,
    shouldOpenAccountsModal,
  ]);

  useEffect(() => {
    if (apiType !== 'PAPI' || !setAccounts) return;
    if (!accounts.length && isLedgerSelected && !ledgerChainSpec) {
      closeAccountsModal();
      return;
    }
    setAccounts(accounts);
  }, [
    accounts,
    apiType,
    closeAccountsModal,
    isLedgerSelected,
    ledgerChainSpec,
    setAccounts,
  ]);

  useEffect(() => {
    if (
      apiType !== 'PAPI' ||
      !savedAddressRef?.current ||
      !setSelectedAccount ||
      selectedAccount
    )
      return;
    const account = accounts.find((a) => a.address === savedAddressRef.current);
    if (!account) return;
    setSelectedAccount(account);
    savedAddressRef.current = undefined;
  }, [accounts, apiType, savedAddressRef, selectedAccount, setSelectedAccount]);

  const connectWalletByName = useCallback(
    async (walletName: string) => {
      const wallet = wallets.find(
        (wallet: Wallet) => wallet.name === walletName,
      );
      if (!wallet) return false;
      await connectWallet(wallet);
      setSelectedWalletName(wallet.name);
      return true;
    },
    [connectWallet, wallets],
  );

  const disconnectWallet = useCallback(() => {
    setSelectedWalletName(undefined);
  }, []);

  const getSignerForAddress = useCallback(
    (
      address: string,
      injectedExtension?: InjectedExtension,
    ): PolkadotSigner => {
      if (injectedExtension) {
        const acc = injectedExtension
          .getAccounts()
          .find((a) => a.address === address);
        if (!acc?.polkadotSigner) throw new Error('No selected account');
        return acc.polkadotSigner;
      }
      const acc = dotAccounts.find((item) => item.address === address);
      if (!acc?.polkadotSigner) throw new Error('No selected account');
      return acc.polkadotSigner;
    },
    [dotAccounts],
  );

  return {
    walletNames,
    selectedWalletName,
    connectWalletByName,
    disconnectWallet,
    accounts,
    getSignerForAddress,
  };
};
