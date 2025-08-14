import type { TAssetInfo, TForeignAssetInfo, TParachain } from '@paraspell/sdk';
import { findAssetInfo, findBestMatches, getAssets, isForeignAsset } from '@paraspell/sdk';

import type { TRouterAsset } from '../types';

export const getSdkAssetByRouterAsset = (
  exchangeBaseChain: TParachain,
  routerAsset: TRouterAsset,
): TAssetInfo | undefined => {
  // Try searching by symbol fist, if duplicates are found, search by location

  const assets = getAssets(exchangeBaseChain);

  const candidates = findBestMatches(assets, routerAsset.symbol);

  if (candidates.length === 0) {
    // No matching asset found by symbol.
    return undefined;
  }

  if (candidates.length === 1) {
    // Exactly one asset found by symbol.
    return candidates[0];
  }

  if (!routerAsset.assetId) {
    // Origin asset is a native asset, but multiple candidates were found.
    return undefined;
  }

  // Origin asset is a foreign asset, try matching by location.
  return candidates.find((asset) => {
    if (!isForeignAsset(asset)) return false;

    let sdkAsset;

    if (asset.location) {
      sdkAsset = findAssetInfo(
        exchangeBaseChain,
        { location: asset.location },
        null,
      ) as TForeignAssetInfo;

      if (sdkAsset) return true;
    }

    if (asset.assetId) {
      sdkAsset = findAssetInfo(exchangeBaseChain, { id: asset.assetId }, null) as TForeignAssetInfo;

      if (sdkAsset) return true;
    }

    return false;
  });
};
