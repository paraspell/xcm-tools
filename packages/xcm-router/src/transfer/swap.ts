import { type ApiPromise } from '@polkadot/api';
import { type TTransferOptionsModified, TransactionType, TransactionStatus } from '../types';
import { maybeUpdateTransferStatus } from '../utils/utils';
import { submitSwap } from './utils';
import { type Extrinsic } from '@paraspell/sdk-pjs';

export const swap = async (
  options: TTransferOptionsModified,
  swapTx: Extrinsic,
  swapApi: ApiPromise,
): Promise<string> => {
  const { onStatusChange } = options;
  maybeUpdateTransferStatus(onStatusChange, {
    type: TransactionType.SWAP,
    status: TransactionStatus.IN_PROGRESS,
  });
  const txHash = await submitSwap(swapApi, options, swapTx);
  maybeUpdateTransferStatus(onStatusChange, {
    type: TransactionType.SWAP,
    hashes: { [TransactionType.SWAP]: txHash },
    status: TransactionStatus.SUCCESS,
  });
  return txHash;
};
