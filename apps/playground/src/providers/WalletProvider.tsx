import {
  web3Accounts,
  web3Enable,
  web3FromAddress,
} from "@polkadot/extension-dapp";
import type { PropsWithChildren } from "react";
import { useEffect, useState } from "react";
import { WalletContext } from "./WalletContext";
import type { TApiType, WalletAccount } from "../types";
import {
  connectInjectedExtension,
  getInjectedExtensions,
  type InjectedExtension,
} from "polkadot-api/pjs-signer";

export const STORAGE_ADDRESS_KEY = "paraspell_wallet_address";
const STORAGE_API_TYPE_KEY = "paraspell_api_type";
const STORAGE_EXTENSION_KEY = "paraspell_connected_extension";

const getAddressFromLocalStorage = (): string | undefined => {
  return localStorage.getItem(STORAGE_ADDRESS_KEY) || undefined;
};

const getApiTypeFromLocalStorage = (): TApiType | undefined => {
  const apiType = localStorage.getItem(STORAGE_API_TYPE_KEY);
  return apiType === "PJS" || apiType === "PAPI" ? apiType : undefined;
};

const getExtensionFromLocalStorage = (): string | undefined => {
  return localStorage.getItem(STORAGE_EXTENSION_KEY) || undefined;
};

const setExtensionInLocalStorage = (extensionName: string | undefined) => {
  if (extensionName) {
    localStorage.setItem(STORAGE_EXTENSION_KEY, extensionName);
  } else {
    localStorage.removeItem(STORAGE_EXTENSION_KEY);
  }
};

const WalletProvider: React.FC<PropsWithChildren<unknown>> = ({ children }) => {
  const [apiType, setApiType] = useState<TApiType>(
    getApiTypeFromLocalStorage() || "PJS",
  );

  const [extensions, setExtensions] = useState<string[]>([]);
  const [injectedExtension, setInjectedExtension] =
    useState<InjectedExtension>();

  const [accounts, setAccounts] = useState<WalletAccount[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<
    WalletAccount | undefined
  >(undefined);

  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (apiType) {
      localStorage.setItem(STORAGE_API_TYPE_KEY, apiType);
    }
  }, [apiType]);

  useEffect(() => {
    if (!isInitialized) return;

    if (selectedAccount) {
      localStorage.setItem(STORAGE_ADDRESS_KEY, selectedAccount.address);
    } else {
      console.log("selectedAccount removed", selectedAccount);
      localStorage.removeItem(STORAGE_ADDRESS_KEY);
    }
  }, [selectedAccount]);

  useEffect(() => {
    const initializeFromStorage = async () => {
      const savedApiType = getApiTypeFromLocalStorage();
      const savedAddress = getAddressFromLocalStorage();
      const savedExtensionName = getExtensionFromLocalStorage();

      if (savedApiType) {
        setApiType(savedApiType);
      }

      if (savedApiType && savedAddress) {
        if (savedApiType === "PJS") {
          const allInjected = await web3Enable("Paraspell");

          if (!allInjected.length) {
            console.warn("No wallet extension found, install it to connect");
            setAccounts([]);
            setSelectedAccount(undefined);
            return;
          }

          const allAccounts = await web3Accounts();
          const walletAccounts = allAccounts.map((account) => ({
            address: account.address,
            meta: {
              name: account.meta.name,
              source: account.meta.source,
            },
          }));
          setAccounts(walletAccounts);

          const account = walletAccounts.find(
            (acc) => acc.address === savedAddress,
          );
          if (account) {
            setSelectedAccount(account);
          } else {
            setSelectedAccount(undefined);
          }
        } else if (savedApiType === "PAPI") {
          const extensions = getInjectedExtensions();
          setExtensions(extensions);

          if (!extensions.length) {
            console.warn("No wallet extension found, install it to connect");
            setAccounts([]);
            setSelectedAccount(undefined);
            return;
          }

          if (!savedExtensionName || !extensions.includes(savedExtensionName)) {
            console.warn("Previously connected extension not found");
            setAccounts([]);
            setSelectedAccount(undefined);
            return;
          }

          const selectedExtension =
            await connectInjectedExtension(savedExtensionName);
          setInjectedExtension(selectedExtension);

          const accounts = selectedExtension.getAccounts();

          const walletAccounts = accounts.map((account) => ({
            address: account.address,
            meta: {
              name: account.name,
              source: selectedExtension.name,
            },
          }));
          setAccounts(walletAccounts);

          const account = walletAccounts.find(
            (acc) => acc.address === savedAddress,
          );
          if (account) {
            setSelectedAccount(account);
          } else {
            setSelectedAccount(undefined);
          }
        }
      }
      setIsInitialized(true);
    };

    void initializeFromStorage();
  }, []);

  useEffect(() => {
    if (apiType === "PJS" && selectedAccount) {
      void web3Enable("Paraspell");
    }
  }, [selectedAccount, apiType]);

  const getSigner = async () => {
    if (!selectedAccount) {
      throw new Error("No selected account");
    }

    if (apiType === "PJS") {
      const injector = await web3FromAddress(selectedAccount.address);
      return injector.signer;
    } else {
      const account = injectedExtension
        ?.getAccounts()
        .find((account) => account.address === selectedAccount.address);
      if (!account) {
        throw new Error("No selected account");
      }
      return account.polkadotSigner;
    }
  };

  return (
    <WalletContext.Provider
      value={{
        apiType,
        setApiType,
        extensions,
        setExtensions,
        injectedExtension,
        setInjectedExtension,
        setExtensionInLocalStorage,
        selectedAccount,
        setSelectedAccount,
        accounts,
        setAccounts,
        getSigner,
        isInitialized,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
};

export default WalletProvider;
