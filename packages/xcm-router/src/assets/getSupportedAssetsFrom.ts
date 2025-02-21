import type { TAsset, TNodeWithRelayChains } from '@paraspell/sdk-pjs';
import { getAssets, normalizeSymbol } from '@paraspell/sdk-pjs';
import { createDexNodeInstance } from '../dexNodes/DexNodeFactory';
import type { TExchangeNode, TAutoSelect } from '../types';
import { getExchangeAssets } from './getExchangeAssets';

/**
 * Retrieves the list of assets supported for transfer from the origin node to the exchange node.
 *
 * @param from - The origin node.
 * @param exchange - The exchange node or 'Auto select'.
 * @returns An array of supported assets.
 */
export const getSupportedAssetsFrom = (
  from: TNodeWithRelayChains | undefined,
  exchange: TExchangeNode | TAutoSelect,
): TAsset[] => {
  if (exchange === 'Auto select') {
    if (!from) return [];
    return getAssets(from);
  }

  const exchangeAssets = getExchangeAssets(createDexNodeInstance(exchange).node, exchange);

  if (!from || from === createDexNodeInstance(exchange).node) {
    return exchangeAssets.map(
      (exchangeAsset) =>
        ({
          ...exchangeAsset,
          ...(exchangeAsset.id !== undefined ? { assetId: exchangeAsset.id } : {}),
        }) as TAsset,
    );
  }

  const fromAssets = getAssets(from);
  return fromAssets.filter((fromAsset) =>
    exchangeAssets.some(
      (exchangeAsset) =>
        normalizeSymbol(exchangeAsset.symbol) === normalizeSymbol(fromAsset.symbol),
    ),
  );
};
