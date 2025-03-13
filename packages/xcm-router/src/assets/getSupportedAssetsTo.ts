import { getAssets, normalizeSymbol, type TNodeWithRelayChains } from '@paraspell/sdk-pjs';

import { EXCHANGE_NODES } from '../consts';
import type { TExchangeInput, TRouterAsset } from '../types';
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
  exchange: TExchangeInput,
  to: TNodeWithRelayChains | undefined,
): TRouterAsset[] => {
  if (exchange === undefined) {
    let allExchangeAssets = EXCHANGE_NODES.map((exchangeNode) =>
      getExchangeAssets(exchangeNode),
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

  let exchangeAssets = Array.isArray(exchange)
    ? exchange.flatMap((exchange) => getExchangeAssets(exchange))
    : getExchangeAssets(exchange);

  if (to) {
    const toAssets = getAssets(to);
    exchangeAssets = exchangeAssets.filter((asset) =>
      toAssets.some((toAsset) => normalizeSymbol(toAsset.symbol) === normalizeSymbol(asset.symbol)),
    );
  }

  return exchangeAssets;
};
