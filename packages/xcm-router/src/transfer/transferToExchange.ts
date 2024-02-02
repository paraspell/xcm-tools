import { type ApiPromise } from '@polkadot/api';
import { type TTransferOptionsModified, TransactionType, TransactionStatus } from '../types';
import { maybeUpdateTransferStatus } from '../utils/utils';
import { submitTransferToExchange } from './utils';

export const transferToExchange = async (
  options: TTransferOptionsModified,
  api: ApiPromise,
): Promise<string> => {
  const { onStatusChange } = options;
  maybeUpdateTransferStatus(onStatusChange, {
    type: TransactionType.TO_EXCHANGE,
    status: TransactionStatus.IN_PROGRESS,
  });
  const txHash = await submitTransferToExchange(api, options);
  maybeUpdateTransferStatus(onStatusChange, {
    type: TransactionType.TO_EXCHANGE,
    hashes: { [TransactionType.TO_EXCHANGE]: txHash },
    status: TransactionStatus.SUCCESS,
  });
  return txHash;
};
