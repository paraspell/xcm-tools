import type { TApiType, TPapiSigner } from '@paraspell/sdk';
import type { Signer } from '@polkadot/api/types';
import type { EIP6963ProviderDetail } from 'mipd';
import type { InjectedExtension } from 'polkadot-api/pjs-signer';
import { createContext } from 'react';
import type { Chain, WalletClient } from 'viem';

import type { TWalletAccount } from '../types';

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
  getSigner: () => Promise<TPapiSigner | Signer>;
  connectWallet: () => Promise<void>;
  changeAccount: () => Promise<void>;
  handleApiSwitch: (value: TApiType) => void;
  isLoadingExtensions: boolean;
  isInitialized: boolean;
  selectedEvmAccount?: TWalletAccount;
  selectedEvmProvider?: EIP6963ProviderDetail;
  getEvmWalletClient: (chain: Chain) => WalletClient | undefined;
  disconnectEvmWallet: () => void;
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
  getSigner: () => Promise.resolve({} as TPapiSigner),
  connectWallet: () => Promise.resolve(),
  changeAccount: () => Promise.resolve(),
  handleApiSwitch: (_value: TApiType) => {},
  isLoadingExtensions: false,
  isInitialized: false,
  selectedEvmAccount: undefined,
  selectedEvmProvider: undefined,
  getEvmWalletClient: () => undefined,
  disconnectEvmWallet: () => {},
};

export const WalletContext = createContext(defaultWalletState);
