import { type ApiPromise } from '@polkadot/api';
import { type TTransferOptionsModified, TransactionType, TransactionStatus } from '../types';
import { maybeUpdateTransferStatus } from '../utils/utils';
import { submitTransferToDestination } from './utils';

export const transferToDestination = async (
  options: TTransferOptionsModified,
  amountOut: string,
  api: ApiPromise,
): Promise<string> => {
  const { onStatusChange } = options;
  maybeUpdateTransferStatus(onStatusChange, {
    type: TransactionType.TO_DESTINATION,
    status: TransactionStatus.IN_PROGRESS,
  });
  const txHash = await submitTransferToDestination(api, options, amountOut);
  maybeUpdateTransferStatus(onStatusChange, {
    type: TransactionType.TO_DESTINATION,
    hashes: { [TransactionType.TO_DESTINATION]: txHash },
    status: TransactionStatus.SUCCESS,
  });
  return txHash;
};
