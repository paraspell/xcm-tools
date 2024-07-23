import { web3Enable } from '@polkadot/extension-dapp';
import { InjectedAccountWithMeta } from '@polkadot/extension-inject/types';
import { PropsWithChildren, useEffect, useState } from 'react';
import { WalletContext } from '../context/WalletContext';
import { NAME } from '../consts/consts';

const STORAGE_KEY = 'wallet-state-xcm-visualizator';

const getWalletStateFromLocalStorage = (): InjectedAccountWithMeta | undefined => {
  const walletState = localStorage.getItem(STORAGE_KEY);

  if (!walletState) {
    return undefined;
  }

  return JSON.parse(walletState) as InjectedAccountWithMeta;
};

const WalletProvider: React.FC<PropsWithChildren<unknown>> = ({ children }) => {
  const [selectedAccount, setSelectedAccount] = useState<InjectedAccountWithMeta | undefined>(
    getWalletStateFromLocalStorage
  );

  useEffect(() => {
    if (selectedAccount) localStorage.setItem(STORAGE_KEY, JSON.stringify(selectedAccount));
  }, [selectedAccount]);

  useEffect(() => {
    void web3Enable(NAME);
  }, []);

  return (
    <WalletContext.Provider value={{ selectedAccount, setSelectedAccount }}>
      {children}
    </WalletContext.Provider>
  );
};

export default WalletProvider;
