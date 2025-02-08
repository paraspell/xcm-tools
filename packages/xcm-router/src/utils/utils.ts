import { type Extrinsic } from '@paraspell/sdk-pjs';
import BigNumber from 'bignumber.js';

export const calculateTransactionFee = async (
  tx: Extrinsic,
  address: string,
): Promise<BigNumber> => {
  const { partialFee } = await tx.paymentInfo(address);
  return new BigNumber(partialFee.toString());
};
