import type { TLocation } from '@paraspell/sdk';
import { deepEqual, reverseTransformLocation } from '@paraspell/sdk';

import { EXCHANGE_CHAINS } from '../consts';
import type { TExchangeChain, TExchangeInput, TRouterAsset } from '../types';
import { getExchangeConfig } from './getExchangeConfig';

const resolveRouterAsset = (
  exchange: TExchangeChain,
  pairKey: string | object,
): TRouterAsset | undefined => {
  const exchangeAssets = getExchangeConfig(exchange).assets;
  const isAh = exchange === 'AssetHubPolkadotDex' || exchange === 'AssetHubKusamaDex';

  if (typeof pairKey === 'object') {
    const candidates = exchangeAssets.filter((a) => a.location);

    let found = candidates.find((a) => deepEqual(pairKey, a.location!));

    if (!found && isAh) {
      const keyXfm = reverseTransformLocation(pairKey as TLocation);
      found = candidates.find((a) => deepEqual(keyXfm, a.location!));
    }
    return found;
  }

  return (
    exchangeAssets.find((a) => pairKey === a.symbol) ??
    exchangeAssets.find((a) => pairKey === a.assetId)
  );
};

const asArray = (ex: TExchangeInput) =>
  ex === undefined ? EXCHANGE_CHAINS : Array.isArray(ex) ? ex : [ex];

export const getExchangePairs = (exchange: TExchangeInput): [TRouterAsset, TRouterAsset][] =>
  asArray(exchange).flatMap((ex) => {
    const { isOmni, assets } = getExchangeConfig(ex);
    if (isOmni) {
      const pairs: [TRouterAsset, TRouterAsset][] = [];

      for (let i = 0; i < assets.length; i++) {
        for (let j = i + 1; j < assets.length; j++) {
          pairs.push([assets[i], assets[j]]);
        }
      }
      return pairs;
    }

    return getExchangeConfig(ex).pairs.flatMap<[TRouterAsset, TRouterAsset]>((pair) => {
      const asset1 = resolveRouterAsset(ex, pair[0]);
      const asset2 = resolveRouterAsset(ex, pair[1]);
      return asset1 && asset2 ? [[asset1, asset2]] : [];
    });
  });
