import type { TAssetInfo, TChain, TCustomCtx, TExchangeChain } from '@paraspell/sdk-core';
import { findAssetInfoOnDestImpl, getSupportedAssetsImpl, isAssetEqual } from '@paraspell/sdk-core';

import { getExchangeAssets } from './getExchangeConfig';

export const resolveOriginAssetOnExchange = <TCustomChain extends string = never>(
  origin: TChain | TCustomChain,
  exchange: TExchangeChain,
  transferableAssets: TAssetInfo[],
  originAsset: TAssetInfo,
  ctx?: TCustomCtx,
): TAssetInfo | null => {
  if (!transferableAssets.some((asset) => isAssetEqual(asset, originAsset))) return null;

  return findAssetInfoOnDestImpl(
    origin,
    exchange,
    { location: originAsset.location },
    originAsset,
    ctx,
  );
};

export const getExchangeAssetByOriginAsset = (
  origin: TChain,
  exchange: TExchangeChain,
  originAsset: TAssetInfo,
  ctx?: TCustomCtx,
): TAssetInfo | undefined => {
  const assetOnExchange = resolveOriginAssetOnExchange(
    origin,
    exchange,
    getSupportedAssetsImpl(origin, exchange, ctx),
    originAsset,
    ctx,
  );

  if (!assetOnExchange) return undefined;

  return getExchangeAssets(exchange).find((asset) => isAssetEqual(asset, assetOnExchange));
};
