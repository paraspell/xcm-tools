import type { TAsset, TForeignAsset, TNodePolkadotKusama } from '@paraspell/sdk';
import { deepEqual, findAsset, findBestMatches, isForeignAsset } from '@paraspell/sdk';

import type { TExchangeNode, TRouterAsset } from '../types';
import { getExchangeAssets } from './getExchangeConfig';

export const getExchangeAssetByOriginAsset = (
  exchangeBaseNode: TNodePolkadotKusama,
  exchange: TExchangeNode,
  originAsset: TAsset,
): TRouterAsset | undefined => {
  const assets = getExchangeAssets(exchange);

  // Try searching by symbol fist, if duplicates are found, search by multi-location
  const candidates = findBestMatches(assets, originAsset.symbol);

  if (candidates.length === 0) {
    // No matching asset found by symbol.
    return undefined;
  }

  if (candidates.length === 1) {
    // Exactly one asset found by symbol.
    const candidate = candidates[0];
    return originAsset.multiLocation
      ? { ...candidate, multiLocation: originAsset.multiLocation }
      : candidate;
  }

  if (!isForeignAsset(originAsset)) {
    // Origin asset is a native asset, but multiple candidates were found.
    return undefined;
  }

  // Origin asset is a foreign asset, try matching by multi-location.
  const candidateByML = candidates.find((asset) => {
    if (asset.assetId === undefined) return false;
    const sdkAsset = findAsset(exchangeBaseNode, { id: asset.assetId }, null) as TForeignAsset;

    if (sdkAsset.multiLocation === undefined) return false;

    if (sdkAsset.multiLocation && originAsset.multiLocation) {
      return deepEqual(sdkAsset.multiLocation, originAsset.multiLocation);
    }

    return false;
  });

  return candidateByML && originAsset.multiLocation
    ? { ...candidateByML, multiLocation: originAsset.multiLocation }
    : candidateByML;
};
