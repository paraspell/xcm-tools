import { createApiInstanceForNode } from '@paraspell/sdk';
import createDexNodeInstance from '../dexNodes/DexNodeFactory';
import {
  type TTransferOptionsModified,
  type TTransferOptions,
  TransactionType,
  TransactionStatus,
} from '../types';
import { delay, maybeUpdateTransferStatus } from '../utils/utils';
import { transferToExchange } from './transferToExchange';
import { swap } from './swap';
import { transferToDestination } from './transferToDestination';
import { selectBestExchange } from './selectBestExchange';

export const transfer = async (options: TTransferOptions): Promise<void> => {
  maybeUpdateTransferStatus(options.onStatusChange, {
    type: TransactionType.TO_EXCHANGE,
    status: TransactionStatus.IN_PROGRESS,
    isAutoSelectingExchange: options.exchange === undefined,
  });

  const dex =
    options.exchange !== undefined
      ? createDexNodeInstance(options.exchange)
      : await selectBestExchange(options);

  maybeUpdateTransferStatus(options.onStatusChange, {
    type: TransactionType.TO_EXCHANGE,
    status: TransactionStatus.IN_PROGRESS,
    isAutoSelectingExchange: false,
  });

  const modifiedOptions: TTransferOptionsModified = { ...options, exchange: dex.node };

  const { from, amount } = modifiedOptions;

  if (options.type === TransactionType.TO_EXCHANGE) {
    const originApi = await createApiInstanceForNode(from);
    await transferToExchange(modifiedOptions, originApi);
  } else if (options.type === TransactionType.SWAP) {
    const originApi = await createApiInstanceForNode(from);
    const swapApi = await dex.createApiInstance();
    await swap(modifiedOptions, dex, originApi, swapApi);
  } else if (options.type === TransactionType.TO_DESTINATION) {
    const swapApi = await dex.createApiInstance();
    await transferToDestination(modifiedOptions, amount, swapApi);
  } else {
    const originApi = await createApiInstanceForNode(from);
    await transferToExchange(modifiedOptions, originApi);
    await delay(1000);
    const swapApi = await dex.createApiInstance();
    const { amountOut } = await swap(modifiedOptions, dex, originApi, swapApi);
    await delay(1000);
    await transferToDestination(modifiedOptions, amountOut, swapApi);
  }
};
