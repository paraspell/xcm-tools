import { FALLBACK_FEE_CALC_ADDRESS } from '../consts';
import { TransactionType, type TTransferOptionsModified } from '../types';

export const MOCK_ADDRESS = '5FA4TfhSWhoDJv39GZPvqjBzwakoX4XTVBNgviqd7sz2YeXC';
export const MOCK_SLIIPPAGE = '1';

export const MOCK_TRANSFER_OPTIONS: TTransferOptionsModified = {
  from: 'Astar',
  exchangeNode: 'Hydration',
  exchange: 'HydrationDex',
  to: 'Interlay',
  currencyFrom: { symbol: 'ASTR' },
  currencyTo: { symbol: 'GLMR' },
  assetFrom: { symbol: 'ASTR', assetId: '0x1234567890abcdef' },
  assetTo: { symbol: 'GLMR', assetId: '0xabcdef1234567890' },
  amount: '10000000000000000000',
  slippagePct: '1',
  injectorAddress: MOCK_ADDRESS,
  recipientAddress: MOCK_ADDRESS,
  signer: {},
  type: TransactionType.FULL_TRANSFER,
  feeCalcAddress: FALLBACK_FEE_CALC_ADDRESS,
};
