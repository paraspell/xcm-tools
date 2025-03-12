import type { TWeight } from '@paraspell/sdk-pjs';
import { type Extrinsic } from '@paraspell/sdk-pjs';

export const getTxWeight = async (tx: Extrinsic, address: string): Promise<TWeight> => {
  const paymentInfo = await tx.paymentInfo(address);
  return {
    refTime: paymentInfo.weight.refTime.toBigInt(),
    proofSize: paymentInfo.weight.proofSize.toBigInt(),
  };
};
