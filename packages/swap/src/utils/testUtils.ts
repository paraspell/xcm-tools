import type { TBuildTransactionsOptions } from '../types';

export const MOCK_ADDRESS = '5FNDaod3wYTvg48s73H1zSB3gVoKNg2okr6UsbyTuLutTXFz';
export const MOCK_SLIIPPAGE = '1';

export const MOCK_TRANSFER_OPTIONS: TBuildTransactionsOptions = {
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
