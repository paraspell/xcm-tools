import type {
  TNodePolkadotKusama,
  TAsset,
  TForeignAsset,
  TMultiLocation,
  TJunction,
} from '@paraspell/sdk-pjs';
import {
  deepEqual,
  findBestMatches,
  getAssetBySymbolOrId,
  isForeignAsset,
} from '@paraspell/sdk-pjs';
import type { TAssetsRecord, TExchangeNode, TRouterAsset } from '../types';
import { compareXcmInteriors, extractJunctions } from './assetsUtils';
import * as assetsMapJson from '../consts/assets.json' with { type: 'json' };
const assetsMap = assetsMapJson as TAssetsRecord;

export const getExchangeAssetByOriginAsset = (
  exchangeBaseNode: TNodePolkadotKusama,
  exchange: TExchangeNode,
  originAsset: TAsset,
): TRouterAsset | undefined => {
  // Try searching by symbol fist, if duplicates are found, search by multi-location

  const assets = assetsMap[exchange];

  const candidates = findBestMatches(assets, originAsset.symbol);

  if (candidates.length === 0) {
    // No matching asset found by symbol.
    return undefined;
  }

  if (candidates.length === 1) {
    // Exactly one asset found by symbol.
    return candidates[0];
  }

  if (!isForeignAsset(originAsset)) {
    // Origin asset is a native asset, but multiple candidates were found.
    return undefined;
  }

  // Origin asset is a foreign asset, try matching by multi-location.
  return candidates.find((asset) => {
    if (asset.id === undefined) return false;
    const sdkAsset = getAssetBySymbolOrId(
      exchangeBaseNode,
      { id: asset.id },
      null,
    ) as TForeignAsset;

    if (sdkAsset.multiLocation === undefined || sdkAsset.xcmInterior) return false;

    if (sdkAsset.multiLocation && originAsset.multiLocation) {
      return deepEqual(sdkAsset.multiLocation, originAsset.multiLocation);
    }

    return compareXcmInteriors(
      extractJunctions(sdkAsset.multiLocation as TMultiLocation),
      originAsset.xcmInterior as TJunction[],
    );
  });
};
