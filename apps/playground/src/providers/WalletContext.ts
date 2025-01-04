import type { Signer } from '@polkadot/api/types';
import type { PolkadotSigner } from 'polkadot-api';
import { createContext } from 'react';
import type { TApiType, WalletAccount } from '../types';
import type { InjectedExtension } from 'polkadot-api/pjs-signer';

type WalletState = {
  selectedAccount?: WalletAccount;
  setSelectedAccount: (account: WalletAccount | undefined) => void;
  extensions: string[];
  setExtensions: (wallets: string[]) => void;
  injectedExtension: InjectedExtension | undefined;
  setInjectedExtension: (extension: InjectedExtension | undefined) => void;
  setExtensionInLocalStorage: (extensionName: string | undefined) => void;
  accounts: WalletAccount[];
  setAccounts: (accounts: WalletAccount[]) => void;
  apiType: TApiType;
  setApiType: (type: TApiType) => void;
  getSigner: () => Promise<PolkadotSigner | Signer>;
  isInitialized: boolean;
};

const defaultWalletState: WalletState = {
  selectedAccount: undefined,
  setSelectedAccount: () => {},
  extensions: [],
  setExtensions: () => {},
  injectedExtension: undefined,
  setInjectedExtension: () => {},
  setExtensionInLocalStorage: () => {},
  accounts: [],
  setAccounts: () => {},
  apiType: 'PJS',
  setApiType: () => {},
  getSigner: () => Promise.resolve({} as PolkadotSigner),
  isInitialized: false,
};

export const WalletContext = createContext(defaultWalletState);
