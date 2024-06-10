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
import { determineFeeCalcAddress } from './utils';
import { ethers } from 'ethers';

export const transfer = async (options: TTransferOptions): Promise<void> => {
  if (options.evmSigner !== undefined && options.evmInjectorAddress === undefined) {
    throw new Error('evmInjectorAddress is required when evmSigner is provided');
  }
  if (options.evmInjectorAddress !== undefined && options.evmSigner === undefined) {
    throw new Error('evmSigner is required when evmInjectorAddress is provided');
  }

  if (options.evmInjectorAddress !== undefined && !ethers.isAddress(options.evmInjectorAddress)) {
    throw new Error('Evm injector address is not a valid Ethereum address');
  }

  if (ethers.isAddress(options.injectorAddress)) {
    throw new Error(
      'Injector address cannot be an Ethereum address. Please use an Evm injector address instead.',
    );
  }

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

  const modifiedOptions: TTransferOptionsModified = {
    ...options,
    exchange: dex.node,
    feeCalcAddress: determineFeeCalcAddress(options.injectorAddress, options.recipientAddress),
  };

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
