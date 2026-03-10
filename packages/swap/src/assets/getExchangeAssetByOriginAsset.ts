import type { TAssetInfo, TExchangeChain } from '@paraspell/sdk';
import { deepEqual } from '@paraspell/sdk';

import { getExchangeAssets } from './getExchangeConfig';

export const getExchangeAssetByOriginAsset = (
  exchange: TExchangeChain,
  originAsset: TAssetInfo,
): TAssetInfo | undefined => {
  const exchangeAssets = getExchangeAssets(exchange);
  return exchangeAssets.find(({ location }) => deepEqual(location, originAsset.location));
};
