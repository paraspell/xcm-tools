import type {
  TNodeWithRelayChains,
  TAsset as SdkTAsset,
  TCurrencyCoreV1,
  TCurrencyInput,
  TNodePolkadotKusama,
  TForeignAsset,
  TMultiLocation,
  TJunction,
} from '@paraspell/sdk-pjs';
import {
  deepEqual,
  findAssetById,
  findAssetByMultiLocation,
  findAssetBySymbol,
  findBestMatches,
  getAssetBySymbolOrId,
  getAssets,
  isForeignAsset,
  isOverrideMultiLocationSpecifier,
} from '@paraspell/sdk-pjs';
import * as assetsMapJson from '../consts/assets.json' with { type: 'json' };
import type { TAsset, TAssetsRecord, TAutoSelect, TExchangeNode } from '../types';
import { createDexNodeInstance } from '../dexNodes/DexNodeFactory';

const assetsMap = assetsMapJson as TAssetsRecord;

export const supportsCurrency = (
  exchangeNode: TExchangeNode,
  currency: TCurrencyCoreV1,
): boolean => {
  const assets = assetsMap[exchangeNode];
  return 'symbol' in currency
    ? assets.some((asset) => asset.symbol === currency.symbol)
    : assets.some((asset) => asset.id === currency.id);
};

export const getExchangeAssetByOriginAsset = (
  exchangeBaseNode: TNodePolkadotKusama,
  exchange: TExchangeNode,
  originAsset: TAsset,
) => {
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
    if (sdkAsset.multiLocation === undefined) return false;
    return deepEqual(sdkAsset.multiLocation, originAsset.multiLocation);
  });
};

export const getExchangeAsset = (
  exchangeBaseNode: TNodePolkadotKusama,
  exchange: TExchangeNode,
  currency: TCurrencyInput,
): TAsset | null => {
  if (
    ('multilocation' in currency && isOverrideMultiLocationSpecifier(currency.multilocation)) ||
    'multiasset' in currency
  ) {
    throw new Error(
      'XCM Router does not support multi-location override or multi-asset currencies yet.',
    );
  }

  const assets = assetsMap[exchange];

  const nativeAssets = assets.filter((asset) => asset.id === undefined);
  const otherAssets = assets
    .filter((asset) => asset.id !== undefined)
    .map((asset) => ({ ...asset, assetId: asset.id })) as TForeignAsset[];

  let asset: TAsset | undefined;
  if ('symbol' in currency) {
    asset = findAssetBySymbol(exchangeBaseNode, null, otherAssets, nativeAssets, currency.symbol);
  } else if (
    'multilocation' in currency &&
    !isOverrideMultiLocationSpecifier(currency.multilocation)
  ) {
    asset = findAssetByMultiLocation(
      otherAssets,
      currency.multilocation as string | TMultiLocation | TJunction[],
    );
  } else if ('id' in currency) {
    asset = findAssetById(otherAssets, currency.id);
  } else {
    throw new Error('Invalid currency input');
  }

  if (asset) {
    return asset;
  }

  return null;
};

/**
 * Retrieves the list of assets supported for transfer from the origin node to the exchange node.
 *
 * @param from - The origin node.
 * @param exchange - The exchange node or 'Auto select'.
 * @returns An array of supported assets.
 */
export const getSupportedAssetsFrom = (
  from: TNodeWithRelayChains | undefined,
  exchange: TExchangeNode | TAutoSelect,
): SdkTAsset[] => {
  if (exchange === 'Auto select') {
    if (!from) return [];
    return getAssets(from);
  }

  const exchangeAssets = assetsMap[exchange];

  if (!from || from === createDexNodeInstance(exchange).node) {
    return exchangeAssets.map((asset) => ({
      ...asset,
      assetId: asset.id,
    }));
  }

  const fromAssets = getAssets(from);
  return fromAssets.filter((fromAsset) =>
    exchangeAssets.some((exchangeAsset) => exchangeAsset.symbol === fromAsset.symbol),
  );
};

/**
 * Retrieves the list of assets supported for transfer to the destination node.
 *
 * @param origin - The origin node.
 * @param exchange - The exchange node or 'Auto select'.
 * @param to - The destination node.
 * @returns An array of supported assets.
 */
export const getSupportedAssetsTo = (
  exchange: TExchangeNode | TAutoSelect,
  to: TNodeWithRelayChains | undefined,
): TAsset[] => {
  if (exchange === 'Auto select') {
    let exchangeAssets = Object.values(assetsMap).flat();
    if (to) {
      const toAssets = getAssets(to);
      exchangeAssets = exchangeAssets.filter((asset) =>
        toAssets.some((toAsset) => toAsset.symbol === asset.symbol),
      );
    }
    return exchangeAssets;
  }

  let exchangeAssets = assetsMap[exchange];

  if (to) {
    const toAssets = getAssets(to);
    exchangeAssets = exchangeAssets.filter((asset) =>
      toAssets.some((toAsset) => toAsset.symbol === asset.symbol),
    );
  }

  return exchangeAssets;
};
