import type { TAssetInfo, TExchangeChain, TExchangeInput, TLocation } from '@paraspell/sdk';
import { deepEqual, EXCHANGE_CHAINS, reverseTransformLocation } from '@paraspell/sdk';

import { getExchangeConfig } from './getExchangeConfig';

const resolvePairAsset = (
  exchange: TExchangeChain,
  location: TLocation,
): TAssetInfo | undefined => {
  const exchangeAssets = getExchangeConfig(exchange).assets;
  const isAh = exchange.includes('AssetHub');

  let found = exchangeAssets.find((a) => deepEqual(location, a.location));

  if (!found && isAh) {
    const keyXfm = reverseTransformLocation(location);
    found = exchangeAssets.find((a) => deepEqual(keyXfm, a.location));
  }
  return found;
};

const asArray = (ex: TExchangeInput) =>
  ex === undefined ? EXCHANGE_CHAINS : Array.isArray(ex) ? ex : [ex];

export const getExchangePairs = (exchange: TExchangeInput): [TAssetInfo, TAssetInfo][] =>
  asArray(exchange).flatMap((ex) => {
    const { isOmni, assets } = getExchangeConfig(ex);
    if (isOmni) {
      const pairs: [TAssetInfo, TAssetInfo][] = [];

      for (let i = 0; i < assets.length; i++) {
        for (let j = i + 1; j < assets.length; j++) {
          pairs.push([assets[i], assets[j]]);
        }
      }
      return pairs;
    }

    return getExchangeConfig(ex).pairs.flatMap<[TAssetInfo, TAssetInfo]>((pair) => {
      const asset1 = resolvePairAsset(ex, pair[0]);
      const asset2 = resolvePairAsset(ex, pair[1]);
      return asset1 && asset2 ? [[asset1, asset2]] : [];
    });
  });
