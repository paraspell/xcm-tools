import { getAssets, normalizeSymbol, type TNodeWithRelayChains } from '@paraspell/sdk-pjs';

import { EXCHANGE_NODES } from '../consts';
import { createDexNodeInstance } from '../dexNodes/DexNodeFactory';
import type { TAutoSelect, TExchangeNode, TRouterAsset } from '../types';
import { getExchangeAssets } from './getExchangeAssets';

/**
 * Retrieves the list of assets supported for transfer to the destination node.
 *
 * @param origin - The origin node.
 * @param exchange - The exchange node or 'Auto select'.
 * @param to - The destination node.
 * @returns An array of supported assets.
 */
export const getSupportedAssetsTo = (
  exchange: TExchangeNode | TAutoSelect,
  to: TNodeWithRelayChains | undefined,
): TRouterAsset[] => {
  if (exchange === 'Auto select') {
    let allExchangeAssets = EXCHANGE_NODES.map((exchangeNode) =>
      getExchangeAssets(createDexNodeInstance(exchangeNode).node, exchangeNode),
    ).flat();
    if (to) {
      const toAssets = getAssets(to);

      allExchangeAssets = allExchangeAssets.filter((asset) =>
        toAssets.some(
          (toAsset) => normalizeSymbol(toAsset.symbol) === normalizeSymbol(asset.symbol),
        ),
      );
    }
    return allExchangeAssets;
  }

  let exchangeAssets = getExchangeAssets(createDexNodeInstance(exchange).node, exchange);

  if (to) {
    const toAssets = getAssets(to);
    exchangeAssets = exchangeAssets.filter((asset) =>
      toAssets.some((toAsset) => normalizeSymbol(toAsset.symbol) === normalizeSymbol(asset.symbol)),
    );
  }

  return exchangeAssets;
};
