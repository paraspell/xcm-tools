import type { TAssetInfo, TNodeWithRelayChains } from '@paraspell/sdk';
import { getAssets } from '@paraspell/sdk';

import { createDexNodeInstance } from '../dexNodes/DexNodeFactory';
import type { TExchangeInput } from '../types';
import { getExchangeAssets } from './getExchangeConfig';
import { isRouterAssetEqual } from './isRouterAssetEqual';

/**
 * Retrieves the list of assets supported for transfer from the origin node to the exchange node.
 *
 * @param from - The origin node.
 * @param exchange - The exchange node or 'Auto select'.
 * @returns An array of supported assets.
 */
export const getSupportedAssetsFrom = (
  from: TNodeWithRelayChains | undefined,
  exchange: TExchangeInput,
): TAssetInfo[] => {
  if (exchange === undefined) {
    if (!from) return [];
    return getAssets(from);
  }

  const exchangeAssets = Array.isArray(exchange)
    ? exchange.flatMap((exchange) => getExchangeAssets(exchange))
    : getExchangeAssets(exchange);

  if (!from || (!Array.isArray(exchange) && from === createDexNodeInstance(exchange).node)) {
    return exchangeAssets as TAssetInfo[];
  }

  const fromAssets = getAssets(from);
  return fromAssets.filter((fromAsset) =>
    exchangeAssets.some((exchangeAsset) => isRouterAssetEqual(fromAsset, exchangeAsset)),
  );
};
