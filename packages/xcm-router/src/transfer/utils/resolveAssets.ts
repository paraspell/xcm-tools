import { findAssetInfo, hasSupportForAsset, InvalidParameterError } from '@paraspell/sdk';

import { getExchangeAsset, getExchangeAssetByOriginAsset } from '../../assets';
import type ExchangeChain from '../../exchanges/ExchangeChain';
import type { TTransferOptions } from '../../types';

export const resolveAssets = (
  dex: ExchangeChain,
  {
    from,
    to,
    currencyFrom,
    currencyTo,
  }: Pick<TTransferOptions, 'from' | 'to' | 'currencyFrom' | 'currencyTo'>,
) => {
  const originSpecified = from && from !== dex.chain;
  const destinationSpecified = to && to !== dex.chain;

  const assetFromOrigin = originSpecified
    ? findAssetInfo(from, currencyFrom, dex.chain)
    : undefined;

  if (originSpecified && !assetFromOrigin) {
    throw new InvalidParameterError(
      `Currency from ${JSON.stringify(currencyFrom)} not found in ${from}.`,
    );
  }

  const assetFromExchange =
    originSpecified && assetFromOrigin
      ? getExchangeAssetByOriginAsset(dex.chain, dex.exchangeChain, assetFromOrigin)
      : getExchangeAsset(dex.exchangeChain, currencyFrom);

  if (!assetFromExchange) {
    throw new InvalidParameterError(
      `Currency from ${JSON.stringify(currencyFrom)} not found in ${dex.exchangeChain}.`,
    );
  }

  const assetTo = getExchangeAsset(dex.exchangeChain, currencyTo);

  if (!assetTo) {
    throw new InvalidParameterError(
      `Currency to ${JSON.stringify(currencyTo)} not found in ${dex.exchangeChain}.`,
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
