import {
  createApiInstanceForNode,
  getAssetBySymbolOrId,
  hasSupportForAsset,
} from '@paraspell/sdk-pjs';
import { getExchangeAsset, getExchangeAssetByOriginAsset } from '../../assets';
import type ExchangeNode from '../../dexNodes/DexNode';
import { createDexNodeInstance } from '../../dexNodes/DexNodeFactory';
import type { TAdditionalTransferOptions } from '../../types';
import { type TBuildTransactionsOptions, type TTransferOptions } from '../../types';
import { selectBestExchange } from '../selectBestExchange';
import { determineFeeCalcAddress } from './utils';

export const prepareTransformedOptions = async <
  T extends TTransferOptions | TBuildTransactionsOptions,
>(
  options: T,
): Promise<{ dex: ExchangeNode; options: T & TAdditionalTransferOptions }> => {
  const { from, to, currencyFrom, currencyTo, exchange } = options;

  const dex =
    exchange !== undefined ? createDexNodeInstance(exchange) : await selectBestExchange(options);

  const originSpecified = from && from !== dex.node;
  const destinationSpecified = to && to !== dex.node;

  const assetFromOrigin = originSpecified
    ? getAssetBySymbolOrId(from, currencyFrom, dex.node)
    : undefined;

  if (originSpecified && !assetFromOrigin) {
    throw new Error(
      `Currency from ${JSON.stringify(options.currencyFrom)} not found in ${options.from}.`,
    );
  }

  const assetFromExchange =
    originSpecified && assetFromOrigin
      ? getExchangeAssetByOriginAsset(dex.node, dex.exchangeNode, assetFromOrigin)
      : getExchangeAsset(dex.node, dex.exchangeNode, currencyFrom);

  if (!assetFromExchange) {
    throw new Error(
      `Currency from ${JSON.stringify(options.currencyFrom)} not found in ${dex.exchangeNode}.`,
    );
  }

  const assetTo = getExchangeAsset(dex.node, dex.exchangeNode, currencyTo);

  if (!assetTo) {
    throw new Error(
      `Currency to ${JSON.stringify(options.currencyTo)} not found in ${dex.exchangeNode}.`,
    );
  }

  if (destinationSpecified && !hasSupportForAsset(to, assetTo.symbol)) {
    throw new Error(`Currency to ${JSON.stringify(options.currencyTo)} not supported by ${to}.`);
  }

  return {
    dex,
    options: {
      ...options,
      origin:
        originSpecified && assetFromOrigin
          ? {
              api: await createApiInstanceForNode(from),
              node: from,
              assetFrom: assetFromOrigin,
            }
          : undefined,
      exchange: {
        api: await dex.createApiInstance(),
        baseNode: dex.node,
        exchangeNode: dex.exchangeNode,
        assetFrom: assetFromExchange,
        assetTo,
      },
      feeCalcAddress: determineFeeCalcAddress(options.senderAddress, options.recipientAddress),
    },
  };
};
