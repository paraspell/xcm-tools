import { findAssetFrom, findAssetTo } from '../../assets/assets';
import { createDexNodeInstance } from '../../dexNodes/DexNodeFactory';
import { type TBuildTransactionsOptions, type TTransferOptions } from '../../types';
import { selectBestExchange } from '../selectBestExchange';
import { determineFeeCalcAddress } from './utils';

export const prepareTransformedOptions = async <
  T extends TTransferOptions | TBuildTransactionsOptions,
>(
  options: T,
) => {
  const { exchange } = options;

  const dex =
    exchange !== undefined ? createDexNodeInstance(exchange) : await selectBestExchange(options);

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
