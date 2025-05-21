import { deepEqual, normalizeSymbol } from '@paraspell/sdk';

import type { TRouterAsset } from '../types';

export const isRouterAssetEqual = (asset1: TRouterAsset, asset2: TRouterAsset) => {
  const ml1 = asset1.multiLocation;
  const ml2 = asset2.multiLocation;

  if (ml1 && ml2) return deepEqual(ml1, ml2);

  return normalizeSymbol(asset1.symbol) === normalizeSymbol(asset2.symbol);
};
