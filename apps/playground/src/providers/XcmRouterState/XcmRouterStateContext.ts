import type { TChain, TSubstrateChain } from '@paraspell/sdk';
import type { TExchangeChain } from '@paraspell/xcm-router';
import { createContext } from 'react';

type XcmRouterState = {
  from: TSubstrateChain;
  setFrom: (from: TSubstrateChain) => void;
  exchange?: TExchangeChain[];
  setExchange: (exchanges?: TExchangeChain[]) => void;
  to: TChain;
  setTo: (to: TChain) => void;
  currencyFromOptionId: string;
  setCurrencyFromOptionId: (currencyFromOptionId: string) => void;
  currencyToOptionId: string;
  setCurrencyToOptionId: (currencyToOptionId: string) => void;
  recipientAddress: string;
  setRecipientAddress: (recipientAddress: string) => void;
  amount: string;
  setAmount: (amount: string) => void;
  slippagePct: string;
  setSlippagePct: (slippagePct: string) => void;
  useApi: boolean;
  setUseApi: (useApi: boolean) => void;
};

export const XcmRouterStateContext = createContext<XcmRouterState | null>(null);
