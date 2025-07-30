import type {
  TCurrencyInput,
  TForeignAssetInfo,
  TLocation,
  TNativeAssetInfo,
} from '@paraspell/sdk';
import {
  findAssetInfoById,
  findAssetInfoByLoc,
  findAssetInfoBySymbol,
  findBestMatches,
  InvalidParameterError,
  isOverrideLocationSpecifier,
  isSymbolSpecifier,
} from '@paraspell/sdk';

import type { TExchangeChain, TRouterAsset } from '../types';
import { getExchangeAssets } from './getExchangeConfig';

export const getExchangeAsset = (
  exchange: TExchangeChain,
  currency: TCurrencyInput,
  throwOnDuplicateSymbol = false,
): TRouterAsset | null => {
  if (
    ('location' in currency && isOverrideLocationSpecifier(currency.location)) ||
    'multiasset' in currency
  ) {
    throw new InvalidParameterError(
      'XCM Router does not support location override or multi-asset currencies yet.',
    );
  }

  const assets = getExchangeAssets(exchange);

  const nativeAssets = assets.filter((asset) => 'isNative' in asset) as TNativeAssetInfo[];

  const otherAssets = assets.filter((asset) => !('isNative' in asset)) as TForeignAssetInfo[];

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
        `Multiple assets found for symbol ${currency.symbol}. Please specify the asset by location.`,
      );
    }

    asset = findAssetInfoBySymbol(null, otherAssets, nativeAssets, currency.symbol);
  } else if ('location' in currency && !isOverrideLocationSpecifier(currency.location)) {
    asset =
      findAssetInfoByLoc(otherAssets, currency.location as string | TLocation) ??
      findAssetInfoByLoc(
        nativeAssets as TForeignAssetInfo[],
        currency.location as string | TLocation,
      );
  } else if ('id' in currency) {
    asset = findAssetInfoById(otherAssets, currency.id);
  } else {
    throw new InvalidParameterError('Invalid currency input');
  }

  if (asset) {
    return asset;
  }

  return null;
};
