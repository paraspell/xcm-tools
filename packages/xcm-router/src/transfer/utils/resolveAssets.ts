import {
  findAssetInfo,
  findAssetInfoOrThrow,
  hasSupportForAsset,
  RoutingResolutionError,
} from '@paraspell/sdk';

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
    feeAsset,
  }: Pick<TTransferOptions, 'from' | 'to' | 'currencyFrom' | 'currencyTo' | 'feeAsset'>,
) => {
  const originSpecified = from && from !== dex.chain;
  const destinationSpecified = to && to !== dex.chain;

  const assetFromOrigin = originSpecified
    ? findAssetInfo(from, currencyFrom, dex.chain)
    : undefined;

  if (originSpecified && !assetFromOrigin) {
    throw new RoutingResolutionError(
      `Currency from ${JSON.stringify(currencyFrom)} not found in ${from}.`,
    );
  }

  const assetFromExchange =
    originSpecified && assetFromOrigin
      ? getExchangeAssetByOriginAsset(dex.exchangeChain, assetFromOrigin)
      : getExchangeAsset(dex.exchangeChain, currencyFrom);

  if (!assetFromExchange) {
    throw new RoutingResolutionError(
      `Currency from ${JSON.stringify(currencyFrom)} not found in ${dex.exchangeChain}.`,
    );
  }

  const assetTo = getExchangeAsset(dex.exchangeChain, currencyTo);

  if (!assetTo) {
    throw new RoutingResolutionError(
      `Currency to ${JSON.stringify(currencyTo)} not found in ${dex.exchangeChain}.`,
    );
  }

  if (destinationSpecified && !hasSupportForAsset(to, assetTo.symbol)) {
    throw new RoutingResolutionError(
      `Currency to ${JSON.stringify(currencyTo)} not supported by ${to}.`,
    );
  }

  const feeAssetFromOrigin =
    feeAsset && originSpecified
      ? (findAssetInfo(from, feeAsset, dex.chain) ?? undefined)
      : undefined;

  if (feeAsset && originSpecified && !feeAssetFromOrigin) {
    throw new RoutingResolutionError(`Fee asset ${JSON.stringify(feeAsset)} not found in ${from}.`);
  }

  const feeAssetFromExchange = feeAsset
    ? feeAssetFromOrigin
      ? getExchangeAssetByOriginAsset(dex.exchangeChain, feeAssetFromOrigin)
      : (getExchangeAsset(dex.exchangeChain, feeAsset) ?? undefined)
    : undefined;

  const resolvedFeeAssetLocation = feeAssetFromOrigin?.location ?? feeAssetFromExchange?.location;

  if (feeAsset && resolvedFeeAssetLocation) {
    const sdkAsset = findAssetInfoOrThrow(
      from ?? dex.chain,
      { location: resolvedFeeAssetLocation },
      null,
    );
    if (!sdkAsset.isFeeAsset) {
      throw new RoutingResolutionError(
        `Asset ${JSON.stringify(feeAsset)} is not a valid fee asset in ${from ?? dex.chain}.`,
      );
    }
  }

  return {
    assetFromOrigin,
    assetFromExchange,
    assetTo,
    feeAssetFromOrigin,
    feeAssetFromExchange,
  };
};
