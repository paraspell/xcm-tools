import type { TChain, TEvmChainFrom } from '@paraspell/sdk';
import { createContext } from 'react';

type EvmTrasferState = {
  from: TEvmChainFrom;
  setFrom: (from: TEvmChainFrom) => void;
  to: TChain;
  setTo: (to: TChain) => void;
  currencyOptionId: string;
  setCurrencyOptionId: (currencyOptionId: string) => void;
  address: string;
  setAddress: (address: string) => void;
  ahAddress: string;
  setAhAddress: (ahAddress: string) => void;
  amount: string;
  setAmount: (amount: string) => void;
  useViem: boolean;
  setUseViem: (useViem: boolean) => void;
};

export const EvmTransferStateContext = createContext<EvmTrasferState | null>(
  null,
);
