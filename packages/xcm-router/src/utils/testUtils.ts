import type { TCommonTransferOptions } from '../types';

export const MOCK_ADDRESS = '5FA4TfhSWhoDJv39GZPvqjBzwakoX4XTVBNgviqd7sz2YeXC';
export const MOCK_SLIIPPAGE = '1';

export const MOCK_TRANSFER_OPTIONS: TCommonTransferOptions = {
  from: 'Astar',
  exchange: 'HydrationDex',
  to: 'Interlay',
  currencyFrom: { symbol: 'ASTR' },
  currencyTo: { symbol: 'GLMR' },
  amount: '10000000000000000000',
  slippagePct: '1',
  senderAddress: MOCK_ADDRESS,
  recipientAddress: MOCK_ADDRESS,
};
