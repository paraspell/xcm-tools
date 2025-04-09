import type { Signer } from '@polkadot/api/types';
import type { PolkadotSigner } from 'polkadot-api';
import type { InjectedExtension } from 'polkadot-api/pjs-signer';
import { createContext } from 'react';

import type { TApiType, TWalletAccount } from '../types';

type WalletState = {
  selectedAccount?: TWalletAccount;
  setSelectedAccount: (account: TWalletAccount | undefined) => void;
  extensions: string[];
  setExtensions: (wallets: string[]) => void;
  injectedExtension: InjectedExtension | undefined;
  setInjectedExtension: (extension: InjectedExtension | undefined) => void;
  setExtensionInLocalStorage: (extensionName: string | undefined) => void;
  accounts: TWalletAccount[];
  setAccounts: (accounts: TWalletAccount[]) => void;
  apiType: TApiType;
  setApiType: (type: TApiType) => void;
  getSigner: () => Promise<PolkadotSigner | Signer>;
  connectWallet: () => Promise<void>;
  changeAccount: () => Promise<void>;
  handleApiSwitch: (value: TApiType) => void;
  setIsUseXcmApiSelected: (value: boolean) => void;
  isUseXcmApiSelected: boolean;
  isLoadingExtensions: boolean;
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
  connectWallet: () => Promise.resolve(),
  changeAccount: () => Promise.resolve(),
  handleApiSwitch: (_value: TApiType) => {},
  setIsUseXcmApiSelected: (_value: boolean) => {},
  isUseXcmApiSelected: false,
  isLoadingExtensions: false,
  isInitialized: false,
};

export const WalletContext = createContext(defaultWalletState);
