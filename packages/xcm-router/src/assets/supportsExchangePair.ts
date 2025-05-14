import { deepEqual, normalizeSymbol } from '@paraspell/sdk';

import { EXCHANGE_NODES } from '../consts';
import type { TExchangeInput, TRouterAsset } from '../types';
import { getExchangeConfig } from './getExchangeConfig';
import { getExchangePairs } from './getExchangePairs';

const asArray = (ex: TExchangeInput) =>
  ex === undefined ? EXCHANGE_NODES : Array.isArray(ex) ? ex : [ex];

export const supportsExchangePair = (
  exchange: TExchangeInput,
  assetA: TRouterAsset,
  assetB: TRouterAsset,
): boolean => {
  for (const ex of asArray(exchange)) {
    const cfg = getExchangeConfig(ex);

    if (cfg.isOmni === true) {
      return true;
    }

    const pairs = getExchangePairs(ex);
    const isBifrost = ex === 'BifrostPolkadotDex' || ex === 'BifrostKusamaDex';

    const sameAsset = (x: TRouterAsset, y: TRouterAsset): boolean => {
      if (x.multiLocation && y.multiLocation && deepEqual(x.multiLocation, y.multiLocation)) {
        return true;
      }
      if (!isBifrost && x.assetId && y.assetId && x.assetId === y.assetId) {
        return true;
      }
      return normalizeSymbol(x.symbol) === normalizeSymbol(y.symbol);
    };

    const supportedHere = pairs.some(
      ([pA, pB]) =>
        (sameAsset(pA, assetA) && sameAsset(pB, assetB)) ||
        (sameAsset(pA, assetB) && sameAsset(pB, assetA)),
    );

    if (supportedHere) {
      return true;
    }
  }

  return false;
};
