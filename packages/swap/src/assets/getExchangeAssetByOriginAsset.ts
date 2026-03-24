import type { TAssetInfo, TExchangeChain } from '@paraspell/sdk-core';
import { deepEqual } from '@paraspell/sdk-core';

import { getExchangeAssets } from './getExchangeConfig';

export const getExchangeAssetByOriginAsset = (
  exchange: TExchangeChain,
  originAsset: TAssetInfo,
): TAssetInfo | undefined => {
  const exchangeAssets = getExchangeAssets(exchange);
  return exchangeAssets.find(({ location }) => deepEqual(location, originAsset.location));
};
