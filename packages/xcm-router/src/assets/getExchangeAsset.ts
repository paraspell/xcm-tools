import type { TCurrencyInput, TForeignAsset, TMultiLocation, TNativeAsset } from '@paraspell/sdk';
import {
  findAssetById,
  findAssetByMultiLocation,
  findAssetBySymbol,
  findBestMatches,
  InvalidParameterError,
  isOverrideMultiLocationSpecifier,
  isSymbolSpecifier,
} from '@paraspell/sdk';

import type { TExchangeNode, TRouterAsset } from '../types';
import { getExchangeAssets } from './getExchangeConfig';

export const getExchangeAsset = (
  exchange: TExchangeNode,
  currency: TCurrencyInput,
  throwOnDuplicateSymbol = false,
): TRouterAsset | null => {
  if (
    ('multilocation' in currency && isOverrideMultiLocationSpecifier(currency.multilocation)) ||
    'multiasset' in currency
  ) {
    throw new InvalidParameterError(
      'XCM Router does not support multi-location override or multi-asset currencies yet.',
    );
  }

  const assets = getExchangeAssets(exchange);

  const nativeAssets = assets.filter((asset) => 'isNative' in asset) as TNativeAsset[];

  const otherAssets = assets.filter((asset) => !('isNative' in asset)) as TForeignAsset[];

  let asset: TRouterAsset | undefined;
  if ('symbol' in currency) {
    if (isSymbolSpecifier(currency.symbol)) {
      throw new InvalidParameterError(
        'Cannot use currency specifiers when using exchange auto select',
      );
    }

    const matches = findBestMatches(assets, currency.symbol);

    if (matches.length > 1 && throwOnDuplicateSymbol) {
      throw new InvalidParameterError(
        `Multiple assets found for symbol ${currency.symbol}. Please specify the asset by Multi-Location.`,
      );
    }

    asset = findAssetBySymbol(null, otherAssets, nativeAssets, currency.symbol);
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
    throw new InvalidParameterError('Invalid currency input');
  }

  if (asset) {
    return asset;
  }

  return null;
};
