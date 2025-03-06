import { createContext } from 'react';

import type { TWalletAccount } from '../types';

interface WalletState {
  selectedAccount?: TWalletAccount;
  setSelectedAccount: (account: TWalletAccount | undefined) => void;
}

const defaultWalletState: WalletState = {
  selectedAccount: undefined,
  setSelectedAccount: () => {}
};

export const WalletContext = createContext(defaultWalletState);
