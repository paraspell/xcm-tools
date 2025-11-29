import type { TSubstrateChain } from '@paraspell/sdk';
import { createContext } from 'react';

import type { TPalletsQuery } from '../../types';

type PalletQueryState = {
  func: TPalletsQuery;
  setFunc: (func: TPalletsQuery) => void;
  chain: TSubstrateChain;
  setChain: (chain: TSubstrateChain) => void;
  pallet: string;
  setPallet: (pallet: string) => void;
  useApi: boolean;
  setUseApi: (useApi: boolean) => void;
};

export const PalletQueryStateContext = createContext<PalletQueryState | null>(
  null,
);
