import { web3Enable } from '@polkadot/extension-dapp';
import { InjectedAccountWithMeta } from '@polkadot/extension-inject/types';
import { PropsWithChildren, createContext, useContext, useEffect, useState } from 'react';

const STORAGE_KEY = 'walletState';

interface WalletState {
  selectedAccount?: InjectedAccountWithMeta;
  setSelectedAccount(account: InjectedAccountWithMeta): void;
}

const defaultWalletState: WalletState = {
  selectedAccount: undefined,
  setSelectedAccount: () => {},
};

const getWalletStateFromLocalStorage = (): InjectedAccountWithMeta | undefined => {
  const walletState = localStorage.getItem(STORAGE_KEY);

  if (!walletState) {
    return undefined;
  }

  return JSON.parse(walletState);
};

const ThemeContext = createContext(defaultWalletState);

export const useWallet = () => useContext(ThemeContext);

const WalletProvider: React.FC<PropsWithChildren<unknown>> = ({ children }) => {
  const [selectedAccount, setSelectedAccount] = useState<InjectedAccountWithMeta | undefined>(
    getWalletStateFromLocalStorage,
  );

  useEffect(() => {
    if (selectedAccount) localStorage.setItem(STORAGE_KEY, JSON.stringify(selectedAccount));
  }, [selectedAccount]);

  useEffect(() => {
    web3Enable('SpellRouter');
  }, []);

  return (
    <ThemeContext.Provider value={{ selectedAccount, setSelectedAccount }}>
      {children}
    </ThemeContext.Provider>
  );
};

export default WalletProvider;
