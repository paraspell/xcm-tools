import type { TAssetInfo } from '@paraspell/sdk-core';
import {
  getAssets,
  isAssetEqual,
  normalizeExchange,
  type TChain,
  type TExchangeInput,
} from '@paraspell/sdk-core';

import { createExchangeInstance } from '../exchanges/ExchangeChainFactory';
import { getExchangeAssets } from './getExchangeConfig';

/**
 * Retrieves the list of assets supported for transfer from the origin chain to the exchange chain.
 *
 * @param from - The origin chain.
 * @param exchange - The exchange chain or 'Auto select'.
 * @returns An array of supported assets.
 */
export const getSupportedAssetsFrom = (
  from: TChain | undefined,
  exchangeInput: TExchangeInput,
): TAssetInfo[] => {
  const exchange = normalizeExchange(exchangeInput);
  if (exchange === undefined) {
    if (!from) return [];
    return getAssets(from);
  }

  const exchangeAssets = Array.isArray(exchange)
    ? exchange.flatMap((exchange) => getExchangeAssets(exchange))
    : getExchangeAssets(exchange);

  if (!from || (!Array.isArray(exchange) && from === createExchangeInstance(exchange).chain)) {
    return exchangeAssets;
  }

  const fromAssets = getAssets(from);
  return fromAssets.filter((fromAsset) =>
    exchangeAssets.some((exchangeAsset) => isAssetEqual(fromAsset, exchangeAsset)),
  );
};
