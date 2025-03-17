import type { TAsset, TForeignAsset, TNodePolkadotKusama } from '@paraspell/sdk-pjs';
import { findAsset, findBestMatches, getAssets, isForeignAsset } from '@paraspell/sdk-pjs';

import type { TRouterAsset } from '../types';

export const getSdkAssetByRouterAsset = (
  exchangeBaseNode: TNodePolkadotKusama,
  routerAsset: TRouterAsset,
): TAsset | undefined => {
  // Try searching by symbol fist, if duplicates are found, search by multi-location

  const assets = getAssets(exchangeBaseNode);

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

  // Origin asset is a foreign asset, try matching by multi-location.
  return candidates.find((asset) => {
    if (!isForeignAsset(asset)) return false;

    let sdkAsset;

    if (asset.multiLocation) {
      sdkAsset = findAsset(
        exchangeBaseNode,
        { multilocation: asset.multiLocation },
        null,
      ) as TForeignAsset;

      if (sdkAsset) return true;
    }

    if (asset.assetId) {
      sdkAsset = findAsset(exchangeBaseNode, { id: asset.assetId }, null) as TForeignAsset;

      if (sdkAsset) return true;
    }

    return false;
  });
};
