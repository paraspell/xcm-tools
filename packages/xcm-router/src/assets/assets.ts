import type { TNodeWithRelayChains, TAsset as SdkTAsset, TCurrencyCoreV1 } from '@paraspell/sdk';
import { getAssets, isForeignAsset } from '@paraspell/sdk';
import * as assetsMapJson from '../consts/assets.json' with { type: 'json' };
import type { TAssetsRecord, TAutoSelect, TExchangeNode } from '../types';

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

export const findAssetFrom = (
  from: TNodeWithRelayChains,
  exchange: TExchangeNode | undefined,
  currency: TCurrencyCoreV1,
): SdkTAsset | undefined => {
  const fromAssets = getAssets(from);
  if (exchange === undefined) {
    return getAssets(from).find((asset) =>
      'symbol' in currency
        ? asset.symbol === currency.symbol
        : isForeignAsset(asset) && asset.assetId === currency.id,
    );
  }

  return fromAssets.find((asset) =>
    'symbol' in currency
      ? asset.symbol === currency.symbol
      : isForeignAsset(asset) && asset.assetId === currency.id,
  );
};

export const findAssetTo = (
  _exchange: TExchangeNode,
  from: TNodeWithRelayChains,
  _to: TNodeWithRelayChains,
  currency: TCurrencyCoreV1,
  isAutomaticSelection = false,
): SdkTAsset | undefined => {
  const fromAssets = getAssets(from);
  if (isAutomaticSelection) {
    return fromAssets.find((asset) =>
      'symbol' in currency
        ? asset.symbol === currency.symbol
        : isForeignAsset(asset) && asset.assetId === currency.id,
    );
  }

  return fromAssets.find((asset) =>
    'symbol' in currency
      ? asset.symbol === currency.symbol
      : isForeignAsset(asset) && asset.assetId === currency.id,
  );
};

export const findAssetInExchangeBySymbol = (exchange: TExchangeNode, currencySymbol: string) => {
  return assetsMap[exchange].find((asset) => asset.symbol === currencySymbol);
};

/**
 * Retrieves the list of assets supported for transfer from the origin node to the exchange node.
 *
 * @param from - The origin node.
 * @param exchange - The exchange node or 'Auto select'.
 * @returns An array of supported assets.
 */
export const getSupportedAssetsFrom = (
  from: TNodeWithRelayChains,
  exchange: TExchangeNode | TAutoSelect,
): SdkTAsset[] => {
  if (exchange === 'Auto select') {
    return getAssets(from);
  }

  const fromAssets = getAssets(from);
  const exchangeAssets = assetsMap[exchange];

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
  origin: TNodeWithRelayChains,
  exchange: TExchangeNode | TAutoSelect,
  to: TNodeWithRelayChains,
): SdkTAsset[] => {
  const originAssets = getAssets(origin);
  const toAssets = getAssets(to);
  if (exchange === 'Auto select') {
    return originAssets.filter((originAsset) =>
      toAssets.some((toAsset) => toAsset.symbol === originAsset.symbol),
    );
  }

  const exchangeAssets = assetsMap[exchange];
  return originAssets
    .filter((originAsset) =>
      exchangeAssets.some((exchangeAsset) => exchangeAsset.symbol === originAsset.symbol),
    )
    .filter((originAsset) => toAssets.some((toAsset) => toAsset.symbol === originAsset.symbol));
};
