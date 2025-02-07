import { type Extrinsic } from '@paraspell/sdk-pjs';
import BigNumber from 'bignumber.js';
import type { TWeight } from '../types';

export const getTxWeight = async (tx: Extrinsic, address: string): Promise<TWeight> => {
  const paymentInfo = await tx.paymentInfo(address);
  return {
    refTime: new BigNumber(paymentInfo.weight.refTime.toString()),
    proofSize: new BigNumber(paymentInfo.weight.proofSize.toString()),
  };
};
