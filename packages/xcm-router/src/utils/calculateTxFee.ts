import type { TPapiTransaction } from '@paraspell/sdk';
import BigNumber from 'bignumber.js';

export const calculateTxFee = async (tx: TPapiTransaction, address: string): Promise<BigNumber> => {
  const fee = await tx.getEstimatedFees(address);
  return new BigNumber(fee.toString());
};
