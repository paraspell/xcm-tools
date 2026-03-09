import { type Extrinsic } from '@paraspell/sdk-pjs';

export const calculateTxFeePjs = async (tx: Extrinsic, address: string): Promise<bigint> => {
  const { partialFee } = await tx.paymentInfo(address);
  return partialFee.toBigInt();
};
