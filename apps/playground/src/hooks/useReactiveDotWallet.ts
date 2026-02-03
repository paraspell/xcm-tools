import { encodeAddress } from '@polkadot/keyring';
import type { Wallet } from '@reactive-dot/core/wallets.js';
import {
  useAccounts,
  useWalletConnector,
  useWallets,
} from '@reactive-dot/react';
import type { LedgerWallet } from '@reactive-dot/wallet-ledger';
import type { PolkadotSigner } from 'polkadot-api';
import type { InjectedExtension } from 'polkadot-api/pjs-signer';
import type { RefObject } from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';

import type { TApiType, TWalletAccount } from '../types';
import { showErrorNotification } from '../utils/notifications';

type ReactiveDotAccount = {
  address: string;
  name?: string;
  wallet: Wallet;
  polkadotSigner?: PolkadotSigner;
};

type UseReactiveDotWalletParams = {
  shouldOpenAccountsModal: RefObject<boolean>;
  openAccountsModal: () => void;
  closeAccountsModal: () => void;
  apiType?: TApiType;
  savedAddressRef?: RefObject<string | undefined>;
  selectedAccount?: TWalletAccount;
  setSelectedAccount?: (account: TWalletAccount | undefined) => void;
  setAccounts?: (accounts: TWalletAccount[]) => void;
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

export const useReactiveDotWallet = ({
  shouldOpenAccountsModal,
  openAccountsModal,
  closeAccountsModal,
  apiType,
  savedAddressRef,
  selectedAccount,
  setSelectedAccount,
  setAccounts,
}: UseReactiveDotWalletParams): UseReactiveDotWalletResult => {
  const wallets = useWallets();
  const dotAccounts = useAccounts({ chainId: null }) as ReactiveDotAccount[];
  const [_, connectWallet] = useWalletConnector();
  const [selectedWalletName, setSelectedWalletName] = useState<
    string | undefined
  >(undefined);

  const walletNames = useMemo(
    () => wallets.map((wallet) => wallet.name),
    [wallets],
  );

  const selectedWallet = useMemo(
    () => wallets.find((wallet) => wallet.name === selectedWalletName),
    [selectedWalletName, wallets],
  );

  const ledgerWallet = useMemo(() => {
    return wallets.find((wallet) => wallet.name === 'Ledger') as
      | LedgerWallet
      | undefined;
  }, [wallets]);

  const [ledgerDotAccounts, setLedgerDotAccounts] = useState<
    ReactiveDotAccount[]
  >([]);
  const [ledgerAccountsLoaded, setLedgerAccountsLoaded] = useState(false);

  useEffect(() => {
    if (selectedWalletName === 'Ledger') {
      setLedgerAccountsLoaded(false);
    }
  }, [selectedWalletName]);

  useEffect(() => {
    if (selectedWallet?.name !== 'Ledger' || !ledgerWallet) {
      return;
    }

    let isCancelled = false;

    const loadLedgerAccounts = async () => {
      setLedgerAccountsLoaded(false);
      try {
        const storedAccounts = Array.from(ledgerWallet.accountStore.values());

        if (!storedAccounts.length) {
          let index = 0;
          let loadedAny = false;

          while (true) {
            try {
              const account = await ledgerWallet.getConnectedAccount(index);
              ledgerWallet.accountStore.add(account);
              loadedAny = true;
              index += 1;
            } catch (_error) {
              if (!loadedAny) {
                showErrorNotification('Failed to read Ledger accounts');
              }
              break;
            }
          }
        }

        const nextAccounts = Array.from(ledgerWallet.accountStore.values());
        if (isCancelled) {
          return;
        }

        const mappedAccounts: ReactiveDotAccount[] = [];

        nextAccounts.forEach((account) => {
          const ledgerAccount = account as {
            publicKey?: Uint8Array;
            name?: string;
          };
          const publicKey = ledgerAccount.publicKey;

          if (!publicKey) {
            return;
          }

          mappedAccounts.push({
            address: encodeAddress(publicKey),
            name: ledgerAccount.name,
            wallet: ledgerWallet,
          });
        });

        setLedgerDotAccounts(mappedAccounts);
      } finally {
        if (!isCancelled) {
          setLedgerAccountsLoaded(true);
        }
      }
    };

    void loadLedgerAccounts();

    return () => {
      isCancelled = true;
      setLedgerAccountsLoaded(false);
    };
  }, [ledgerWallet, selectedWallet]);

  const accounts = useMemo<TWalletAccount[]>(() => {
    if (!selectedWallet) {
      return [];
    }

    const sourceAccounts =
      selectedWallet.name === 'Ledger'
        ? ledgerDotAccounts
        : dotAccounts.filter(
            (account) => account.wallet.name === selectedWallet.name,
          );

    return sourceAccounts.map((account) => ({
      address: account.address,
      meta: {
        name: account.name,
        source: selectedWallet.name,
      },
    }));
  }, [dotAccounts, ledgerDotAccounts, selectedWallet]);

  useEffect(() => {
    if (!selectedWallet) {
      return;
    }

    if (selectedWallet.name === 'Ledger' && !ledgerAccountsLoaded) {
      return;
    }

    if (!accounts.length) {
      if (
        shouldOpenAccountsModal.current &&
        !(selectedWallet.name === 'Ledger' && !ledgerAccountsLoaded)
      ) {
        showErrorNotification('Selected wallet has no accounts');
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
    ledgerAccountsLoaded,
    openAccountsModal,
    selectedWallet,
    shouldOpenAccountsModal,
  ]);

  useEffect(() => {
    if (apiType !== 'PAPI' || !setAccounts) {
      return;
    }

    if (
      !accounts.length &&
      !(selectedWallet?.name === 'Ledger' && !ledgerAccountsLoaded)
    ) {
      closeAccountsModal();
    }

    setAccounts(accounts);
  }, [
    accounts,
    apiType,
    closeAccountsModal,
    ledgerAccountsLoaded,
    selectedWallet,
    setAccounts,
  ]);

  useEffect(() => {
    if (apiType !== 'PAPI') {
      return;
    }

    if (!savedAddressRef?.current || !setSelectedAccount || selectedAccount) {
      return;
    }

    const account = accounts.find(
      (item) => item.address === savedAddressRef.current,
    );

    if (!account) {
      return;
    }

    setSelectedAccount(account);
    savedAddressRef.current = undefined;
  }, [accounts, apiType, savedAddressRef, selectedAccount, setSelectedAccount]);

  const connectWalletByName = useCallback(
    async (walletName: string) => {
      const wallet = wallets.find((item) => item.name === walletName);

      if (!wallet) {
        return false;
      }

      await connectWallet(wallet);
      setSelectedWalletName(wallet.name);
      return true;
    },
    [connectWallet, wallets],
  );

  const disconnectWallet = useCallback(() => {
    //Prevent the modification of the accounts until the modal is closed
    setTimeout(() => {
      setSelectedWalletName(undefined);
    }, 200);
  }, []);

  const getSignerForAddress = useCallback(
    (
      address: string,
      injectedExtension?: InjectedExtension,
    ): PolkadotSigner => {
      if (injectedExtension) {
        const injectedAccount = injectedExtension
          .getAccounts()
          .find((account) => account.address === address);

        if (!injectedAccount?.polkadotSigner) {
          throw new Error('No selected account');
        }

        return injectedAccount.polkadotSigner;
      }

      const account = dotAccounts.find((item) => item.address === address);

      if (!account?.polkadotSigner) {
        throw new Error('No selected account');
      }

      return account.polkadotSigner;
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
