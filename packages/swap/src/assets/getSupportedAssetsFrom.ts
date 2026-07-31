import type { TAssetInfo, TCustomCtx } from '@paraspell/sdk-core';
import {
  getAssetsImpl,
  isAssetEqual,
  normalizeExchange,
  type TChain,
  type TExchangeInput,
} from '@paraspell/sdk-core';

import { createExchangeInstance } from '../exchanges/ExchangeChainFactory';
import { filterCompatibleExchanges } from './filterCompatibleExchanges';
import { getExchangeAssets } from './getExchangeConfig';

export const getSupportedAssetsFromImpl = <TCustomChain extends string = never>(
  from: TChain | TCustomChain | undefined,
  exchangeInput: TExchangeInput,
  ctx?: TCustomCtx,
): TAssetInfo[] => {
  const exchange = normalizeExchange(exchangeInput);
  if (exchange === undefined) {
    if (!from) return [];
    return getAssetsImpl(from, ctx);
  }

  const exchangeChains = filterCompatibleExchanges(
    Array.isArray(exchange) ? exchange : [exchange],
    from,
    ctx,
  );
  const exchangeAssets = exchangeChains.flatMap((exchange) => getExchangeAssets(exchange));

  if (
    !from ||
    (exchangeChains.length === 1 &&
      !Array.isArray(exchange) &&
      from === createExchangeInstance(exchangeChains[0]).chain)
  ) {
    return exchangeAssets;
  }

  const fromAssets = getAssetsImpl(from, ctx);
  return fromAssets.filter((fromAsset) =>
    exchangeAssets.some((exchangeAsset) => isAssetEqual(fromAsset, exchangeAsset)),
  );
};

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
): TAssetInfo[] => getSupportedAssetsFromImpl(from, exchangeInput);
