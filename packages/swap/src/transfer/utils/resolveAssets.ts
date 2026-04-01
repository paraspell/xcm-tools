import {
  findAssetInfo,
  findAssetInfoOrThrow,
  hasSupportForAsset,
  RoutingResolutionError,
} from '@paraspell/sdk-core';

import { getExchangeAsset, getExchangeAssetByOriginAsset } from '../../assets';
import type ExchangeChain from '../../exchanges/ExchangeChain';
import type { TTransferBaseOptions } from '../../types';

export const resolveAssets = <TApi, TRes, TSigner>(
  dex: ExchangeChain,
  {
    from,
    to,
    currencyFrom,
    currencyTo,
    feeAsset,
  }: Pick<
    TTransferBaseOptions<TApi, TRes, TSigner>,
    'from' | 'to' | 'currencyFrom' | 'currencyTo' | 'feeAsset'
  >,
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
      ? getExchangeAssetByOriginAsset(dex.chain, assetFromOrigin)
      : getExchangeAsset(dex.chain, currencyFrom);

  if (!assetFromExchange) {
    if (!originSpecified && findAssetInfo(dex.chain, currencyFrom)) {
      throw new RoutingResolutionError(
        `Currency from ${JSON.stringify(currencyFrom)} exists in ${dex.chain} but is not swappable on ${dex.chain}.`,
      );
    }
    throw new RoutingResolutionError(
      `Currency from ${JSON.stringify(currencyFrom)} not found in ${dex.chain}.`,
    );
  }

  const assetTo = getExchangeAsset(dex.chain, currencyTo);

  if (!assetTo) {
    throw new RoutingResolutionError(
      `Currency to ${JSON.stringify(currencyTo)} not found in ${dex.chain}.`,
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
      ? getExchangeAssetByOriginAsset(dex.chain, feeAssetFromOrigin)
      : (getExchangeAsset(dex.chain, feeAsset) ?? undefined)
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
