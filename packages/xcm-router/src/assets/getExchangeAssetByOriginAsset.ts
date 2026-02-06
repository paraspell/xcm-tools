import type { TAssetInfo } from '@paraspell/sdk';
import { deepEqual } from '@paraspell/sdk';

import type { TExchangeChain, TRouterAsset } from '../types';
import { getExchangeAssets } from './getExchangeConfig';

export const getExchangeAssetByOriginAsset = (
  exchange: TExchangeChain,
  originAsset: TAssetInfo,
): TRouterAsset | undefined => {
  const exchangeAssets = getExchangeAssets(exchange);
  return exchangeAssets.find(({ location }) => deepEqual(location, originAsset.location));
};
