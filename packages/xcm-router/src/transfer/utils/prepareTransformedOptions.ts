import { findAssetFrom, findAssetTo } from '../../assets/assets';
import { createDexNodeInstance } from '../../dexNodes/DexNodeFactory';
import {
  TransactionStatus,
  TransactionType,
  type TBuildTransferExtrinsicsOptions,
  type TTransferOptions,
} from '../../types';
import { maybeUpdateTransferStatus } from '../../utils/utils';
import { selectBestExchange } from '../selectBestExchange';
import { determineFeeCalcAddress } from './utils';

export const prepareTransformedOptions = async <
  T extends TTransferOptions | TBuildTransferExtrinsicsOptions,
>(
  options: T,
) => {
  const { exchange } = options;

  if ('onStatusChange' in options) {
    maybeUpdateTransferStatus(options.onStatusChange, {
      type: TransactionType.TO_EXCHANGE,
      status: TransactionStatus.IN_PROGRESS,
      isAutoSelectingExchange: exchange === undefined,
    });
  }

  const dex =
    exchange !== undefined ? createDexNodeInstance(exchange) : await selectBestExchange(options);

  if ('onStatusChange' in options) {
    maybeUpdateTransferStatus(options.onStatusChange, {
      type: TransactionType.TO_EXCHANGE,
      status: TransactionStatus.IN_PROGRESS,
      isAutoSelectingExchange: false,
    });
  }

  const assetFrom = findAssetFrom(options.from, dex.exchangeNode, options.currencyFrom);

  if (!assetFrom && 'id' in options.currencyFrom) {
    throw new Error(
      `Currency from ${JSON.stringify(options.currencyFrom)} not found in ${options.from}.`,
    );
  }

  const assetTo = findAssetTo(
    dex.exchangeNode,
    options.from,
    options.to,
    options.currencyTo,
    exchange === undefined,
  );

  if (!assetTo && 'id' in options.currencyTo) {
    throw new Error(
      `Currency to ${JSON.stringify(options.currencyTo)} not found in ${options.from}.`,
    );
  }

  return {
    dex,
    options: {
      ...options,
      exchangeNode: dex.node,
      exchange: dex.exchangeNode,
      assetFrom,
      assetTo,
      feeCalcAddress: determineFeeCalcAddress(options.injectorAddress, options.recipientAddress),
    },
  };
};
