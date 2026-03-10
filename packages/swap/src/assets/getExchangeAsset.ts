import type { TAssetInfo, TCurrencyInput, TExchangeChain } from '@paraspell/sdk';
import {
  findAssetInfoById,
  findAssetInfoByLoc,
  findAssetInfoBySymbol,
  findBestMatches,
  isOverrideLocationSpecifier,
  isSymbolSpecifier,
  RoutingResolutionError,
  UnsupportedOperationError,
} from '@paraspell/sdk';

import { getExchangeAssets } from './getExchangeConfig';

export const getExchangeAsset = (
  exchange: TExchangeChain,
  currency: TCurrencyInput,
  throwOnDuplicateSymbol = false,
): TAssetInfo | null => {
  if (
    ('location' in currency && isOverrideLocationSpecifier(currency.location)) ||
    Array.isArray(currency)
  ) {
    throw new UnsupportedOperationError(
      'XCM Router does not support location override or multi-asset currencies yet.',
    );
  }

  const assets = getExchangeAssets(exchange);

  const nativeAssets = assets.filter((asset) => asset.isNative);
  const otherAssets = assets.filter((asset) => !asset.isNative);

  let asset: TAssetInfo | undefined;
  if ('symbol' in currency) {
    if (!isSymbolSpecifier(currency.symbol)) {
      const matches = findBestMatches(assets, currency.symbol);

      if (matches.length > 1 && throwOnDuplicateSymbol) {
        throw new RoutingResolutionError(
          `Multiple assets found for symbol ${currency.symbol}. Please specify the asset by location.`,
        );
      }
    }

    asset = findAssetInfoBySymbol(null, otherAssets, nativeAssets, currency.symbol);
  } else if ('location' in currency && !isOverrideLocationSpecifier(currency.location)) {
    asset = findAssetInfoByLoc(assets, currency.location);
  } else if ('id' in currency) {
    asset = findAssetInfoById(otherAssets, currency.id);
  } else {
    throw new RoutingResolutionError('Invalid currency input');
  }

  if (asset) {
    return asset;
  }

  return null;
};
