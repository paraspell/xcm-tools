import { findAssetInfo, hasSupportForAsset, InvalidParameterError } from '@paraspell/sdk';

import { getExchangeAsset, getExchangeAssetByOriginAsset } from '../../assets';
import type ExchangeNode from '../../dexNodes/DexNode';
import type { TTransferOptions } from '../../types';

export const resolveAssets = (
  dex: ExchangeNode,
  {
    from,
    to,
    currencyFrom,
    currencyTo,
  }: Pick<TTransferOptions, 'from' | 'to' | 'currencyFrom' | 'currencyTo'>,
) => {
  const originSpecified = from && from !== dex.node;
  const destinationSpecified = to && to !== dex.node;

  const assetFromOrigin = originSpecified ? findAssetInfo(from, currencyFrom, dex.node) : undefined;

  if (originSpecified && !assetFromOrigin) {
    throw new InvalidParameterError(
      `Currency from ${JSON.stringify(currencyFrom)} not found in ${from}.`,
    );
  }

  const assetFromExchange =
    originSpecified && assetFromOrigin
      ? getExchangeAssetByOriginAsset(dex.node, dex.exchangeNode, assetFromOrigin)
      : getExchangeAsset(dex.exchangeNode, currencyFrom);

  if (!assetFromExchange) {
    throw new InvalidParameterError(
      `Currency from ${JSON.stringify(currencyFrom)} not found in ${dex.exchangeNode}.`,
    );
  }

  const assetTo = getExchangeAsset(dex.exchangeNode, currencyTo);

  if (!assetTo) {
    throw new InvalidParameterError(
      `Currency to ${JSON.stringify(currencyTo)} not found in ${dex.exchangeNode}.`,
    );
  }

  if (destinationSpecified && !hasSupportForAsset(to, assetTo.symbol)) {
    throw new InvalidParameterError(
      `Currency to ${JSON.stringify(currencyTo)} not supported by ${to}.`,
    );
  }

  return {
    assetFromOrigin,
    assetFromExchange,
    assetTo,
  };
};
