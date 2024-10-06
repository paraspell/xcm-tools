import type { InjectedAccountWithMeta } from '@polkadot/extension-inject/types';
import { createContext } from 'react';

interface WalletState {
  selectedAccount?: InjectedAccountWithMeta;
  setSelectedAccount: (account: InjectedAccountWithMeta) => void;
}

const defaultWalletState: WalletState = {
  selectedAccount: undefined,
  setSelectedAccount: (_account: InjectedAccountWithMeta) => {}
};

export const WalletContext = createContext(defaultWalletState);
