import type { TAssetInfo, TForeignAssetInfo, TParachain } from '@paraspell/sdk';
import { deepEqual, findAssetInfo, findBestMatches, isForeignAsset } from '@paraspell/sdk';

import type { TExchangeChain, TRouterAsset } from '../types';
import { getExchangeAssets } from './getExchangeConfig';

export const getExchangeAssetByOriginAsset = (
  exchangeBaseChain: TParachain,
  exchange: TExchangeChain,
  originAsset: TAssetInfo,
): TRouterAsset | undefined => {
  const assets = getExchangeAssets(exchange);

  // Try searching by symbol fist, if duplicates are found, search by location
  const symbol = originAsset.symbol;
  const symbolCandidates = [symbol];

  // Handle Moonbeam xc- prefix
  if (symbol.startsWith('xc')) symbolCandidates.push(symbol.slice(2));

  const candidates = symbolCandidates.flatMap((sym) => findBestMatches(assets, sym));

  if (candidates.length === 0) {
    // No matching asset found by symbol.
    return undefined;
  }

  if (candidates.length === 1) {
    // Exactly one asset found by symbol.
    const candidate = candidates[0];
    return originAsset.location ? { ...candidate, location: originAsset.location } : candidate;
  }

  if (!isForeignAsset(originAsset)) {
    // Origin asset is a native asset, but multiple candidates were found.
    return undefined;
  }

  // Origin asset is a foreign asset, try matching by location.
  const candidateByML = candidates.find((asset) => {
    if (asset.assetId === undefined) return false;
    const sdkAsset = findAssetInfo(
      exchangeBaseChain,
      { id: asset.assetId },
      null,
    ) as TForeignAssetInfo;

    if (sdkAsset.location === undefined) return false;

    if (sdkAsset.location && originAsset.location) {
      return deepEqual(sdkAsset.location, originAsset.location);
    }

    return false;
  });

  return candidateByML && originAsset.location
    ? { ...candidateByML, location: originAsset.location }
    : candidateByML;
};
