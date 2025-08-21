import type { FC, PropsWithChildren } from 'react';
import { useEffect, useState } from 'react';

import { WalletContext } from '../context/WalletContext';
import type { TWalletAccount } from '../types';

const STORAGE_KEY = 'wallet-xcm-visualizer';

const getWalletStateFromLocalStorage = (): TWalletAccount | undefined => {
  const walletState = localStorage.getItem(STORAGE_KEY);

  if (!walletState) {
    return undefined;
  }

  return JSON.parse(walletState) as TWalletAccount;
};

const WalletProvider: FC<PropsWithChildren> = ({ children }) => {
  const [selectedAccount, setSelectedAccount] = useState<TWalletAccount | undefined>(
    getWalletStateFromLocalStorage
  );

  useEffect(() => {
    if (selectedAccount) localStorage.setItem(STORAGE_KEY, JSON.stringify(selectedAccount));
  }, [selectedAccount]);

  return (
    <WalletContext.Provider value={{ selectedAccount, setSelectedAccount }}>
      {children}
    </WalletContext.Provider>
  );
};

export default WalletProvider;
