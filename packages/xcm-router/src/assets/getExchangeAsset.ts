import type {
  TNodePolkadotKusama,
  TCurrencyInput,
  TForeignAsset,
  TMultiLocation,
  TNativeAsset,
} from '@paraspell/sdk-pjs';
import {
  isOverrideMultiLocationSpecifier,
  isSymbolSpecifier,
  findBestMatches,
  findAssetBySymbol,
  findAssetByMultiLocation,
  findAssetById,
} from '@paraspell/sdk-pjs';
import type { TExchangeNode, TRouterAsset } from '../types';
import { getExchangeAssets } from './getExchangeAssets';

export const getExchangeAsset = (
  exchangeBaseNode: TNodePolkadotKusama,
  exchange: TExchangeNode,
  currency: TCurrencyInput,
  throwOnDuplicateSymbol = false,
): TRouterAsset | null => {
  if (
    ('multilocation' in currency && isOverrideMultiLocationSpecifier(currency.multilocation)) ||
    'multiasset' in currency
  ) {
    throw new Error(
      'XCM Router does not support multi-location override or multi-asset currencies yet.',
    );
  }

  const assets = getExchangeAssets(exchangeBaseNode, exchange);

  const nativeAssets = assets.filter((asset) => 'isNative' in asset) as TNativeAsset[];

  const otherAssets = assets
    .filter((asset) => !('isNative' in asset))
    .map((asset) => ({
      ...asset,
      ...(asset.id !== undefined ? { assetId: asset.id } : {}),
    })) as TForeignAsset[];

  let asset: TRouterAsset | undefined;
  if ('symbol' in currency) {
    if (isSymbolSpecifier(currency.symbol)) {
      throw new Error('Cannot use currency specifiers when using exchange auto select');
    }

    const matches = findBestMatches(assets, currency.symbol);

    if (matches.length > 1 && throwOnDuplicateSymbol) {
      throw new Error(
        `Multiple assets found for symbol ${currency.symbol}. Please specify the asset by Multi-Location.`,
      );
    }

    asset = findAssetBySymbol(exchangeBaseNode, null, otherAssets, nativeAssets, currency.symbol);
  } else if (
    'multilocation' in currency &&
    !isOverrideMultiLocationSpecifier(currency.multilocation)
  ) {
    asset =
      findAssetByMultiLocation(otherAssets, currency.multilocation as string | TMultiLocation) ??
      findAssetByMultiLocation(
        nativeAssets as TForeignAsset[],
        currency.multilocation as string | TMultiLocation,
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
