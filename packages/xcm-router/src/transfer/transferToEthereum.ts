import { createApiInstanceForNode } from '@paraspell/sdk-pjs';
import type { TTransferOptionsModified } from '../types';
import { TransactionType, TransactionStatus } from '../types';
import { maybeUpdateTransferStatus } from '../utils/utils';
import { submitTransferToDestination } from './utils';

export const transferToEthereum = async (options: TTransferOptionsModified, amountOut: string) => {
  const { onStatusChange } = options;
  maybeUpdateTransferStatus(onStatusChange, {
    type: TransactionType.TO_ETH,
    status: TransactionStatus.IN_PROGRESS,
  });
  const assetHubApi = await createApiInstanceForNode('AssetHubPolkadot');
  await submitTransferToDestination(assetHubApi, options, amountOut, true);
  maybeUpdateTransferStatus(onStatusChange, {
    type: TransactionType.TO_ETH,
    status: TransactionStatus.SUCCESS,
  });
};
