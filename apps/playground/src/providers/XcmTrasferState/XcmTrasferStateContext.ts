import type { TChain, TSubstrateChain } from '@paraspell/sdk';
import { createContext } from 'react';

import type { TCurrencyEntry } from '../../components/XcmTransfer/XcmTransferForm';

type XcmTransferState = {
  from: TSubstrateChain;
  setFrom: (from: TSubstrateChain) => void;
  to: TChain;
  setTo: (to: TChain) => void;
  currencies: TCurrencyEntry[];
  setCurrencies: (currencies: TCurrencyEntry[]) => void;
  feeAsset: Omit<TCurrencyEntry, 'amount' | 'isMax'>;
  setFeeAsset: (feeAsset: Omit<TCurrencyEntry, 'amount' | 'isMax'>) => void;
  address: string;
  setAddress: (address: string) => void;
  ahAddress: string;
  setAhAddress: (ahAddress: string) => void;
  useApi: boolean;
  setUseApi: (useApi: boolean) => void;
  useXcmFormatCheck: boolean;
  setUseXcmFormatCheck: (useXcmFormatCheck: boolean) => void;
};

export const XcmTransferStateContext = createContext<XcmTransferState | null>(
  null,
);
