import { isAssetEqual } from '@paraspell/sdk';

import { EXCHANGE_CHAINS } from '../consts';
import type { TExchangeInput, TRouterAsset } from '../types';
import { getExchangeConfig } from './getExchangeConfig';
import { getExchangePairs } from './getExchangePairs';

const asArray = (ex: TExchangeInput) =>
  ex === undefined ? EXCHANGE_CHAINS : Array.isArray(ex) ? ex : [ex];

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

    const supportedHere = pairs.some(
      ([pA, pB]) =>
        (isAssetEqual(pA, assetA) && isAssetEqual(pB, assetB)) ||
        (isAssetEqual(pA, assetB) && isAssetEqual(pB, assetA)),
    );

    if (supportedHere) return true;
  }

  return false;
};
