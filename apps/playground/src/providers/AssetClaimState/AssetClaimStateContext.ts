import type { TSubstrateChain } from '@paraspell/sdk';
import { createContext } from 'react';

type AssetClaimState = {
  from: TSubstrateChain;
  setFrom: (from: TSubstrateChain) => void;
  address: string;
  setAddress: (address: string) => void;
  amount: string;
  setAmount: (amount: string) => void;
  useApi: boolean;
  setUseApi: (useApi: boolean) => void;
};

export const AssetClaimStateContext = createContext<AssetClaimState | null>(
  null,
);
