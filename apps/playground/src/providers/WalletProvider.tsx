import { web3Enable } from "@polkadot/extension-dapp";
import { InjectedAccountWithMeta } from "@polkadot/extension-inject/types";
import { PropsWithChildren, useEffect, useState } from "react";
import { ThemeContext } from "./ThemeContext";

const STORAGE_KEY = "walletState";

const getWalletStateFromLocalStorage = ():
  | InjectedAccountWithMeta
  | undefined => {
  const walletState = localStorage.getItem(STORAGE_KEY);

  if (!walletState) {
    return undefined;
  }

  return JSON.parse(walletState) as InjectedAccountWithMeta;
};

const WalletProvider: React.FC<PropsWithChildren<unknown>> = ({ children }) => {
  const [selectedAccount, setSelectedAccount] = useState<
    InjectedAccountWithMeta | undefined
  >(getWalletStateFromLocalStorage);

  useEffect(() => {
    if (selectedAccount)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(selectedAccount));
  }, [selectedAccount]);

  useEffect(() => {
    void web3Enable("SpellRouter");
  }, []);

  return (
    <ThemeContext.Provider value={{ selectedAccount, setSelectedAccount }}>
      {children}
    </ThemeContext.Provider>
  );
};

export default WalletProvider;
