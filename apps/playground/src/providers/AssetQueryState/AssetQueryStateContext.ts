import type { TChain, TSubstrateChain } from '@paraspell/sdk';
import { createContext } from 'react';

import type {
  TCurrencyType,
  TCustomCurrencySymbolSpecifier,
} from '../../components/AssetsQueries/AssetsQueriesForm';
import type { TAssetsQuery } from '../../types';

type AssetQueryState = {
  func: TAssetsQuery;
  setFunc: (func: TAssetsQuery) => void;
  chain: TSubstrateChain;
  setChain: (chain: TSubstrateChain) => void;
  destination: TChain;
  setDestination: (destinations: TChain) => void;
  currency: string;
  setCurrency: (currency: string) => void;
  amount: string;
  setAmount: (amount: string) => void;
  address: string;
  setAddress: (address: string) => void;
  useApi: boolean;
  setUseApi: (useApi: boolean) => void;
  currencyType?: TCurrencyType;
  setCurrencyType: (currencyType: TCurrencyType) => void;
  customCurrencySymbolSpecifier?: TCustomCurrencySymbolSpecifier;
  setCustomCurrencySymbolSpecifier: (
    customSpecifier?: TCustomCurrencySymbolSpecifier,
  ) => void;
};

export const AssetQueryStateContext = createContext<AssetQueryState | null>(
  null,
);
