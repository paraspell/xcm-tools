import type { TAssetInfo, TCustomCtx } from '@paraspell/sdk-core';
import {
  getAssetsImpl,
  getSupportedAssetsImpl,
  isAssetEqual,
  normalizeExchange,
  type TChain,
  type TExchangeInput,
} from '@paraspell/sdk-core';

import { resolveOriginAssetOnExchange } from './getExchangeAssetByOriginAsset';
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

  const exchanges = Array.isArray(exchange) ? exchange : [exchange];

  if (!from || (!Array.isArray(exchange) && from === exchange)) {
    return exchanges.flatMap((ex) => getExchangeAssets(ex));
  }

  const entries = exchanges.map((ex) => ({
    exchange: ex,
    exchangeAssets: getExchangeAssets(ex),
    transferableAssets: from === ex ? undefined : getSupportedAssetsImpl(from, ex, ctx),
  }));

  const fromAssets = getAssetsImpl(from, ctx);
  return fromAssets.filter((fromAsset) =>
    entries.some(({ exchange: ex, exchangeAssets, transferableAssets }) => {
      if (transferableAssets === undefined) {
        return exchangeAssets.some((exchangeAsset) => isAssetEqual(exchangeAsset, fromAsset));
      }

      const assetOnExchange = resolveOriginAssetOnExchange(
        from,
        ex,
        transferableAssets,
        fromAsset,
        ctx,
      );

      return (
        assetOnExchange !== null &&
        exchangeAssets.some((exchangeAsset) => isAssetEqual(exchangeAsset, assetOnExchange))
      );
    }),
  );
};

/**
 * Retrieves the list of assets supported for transfer from the origin chain to the exchange chain.
 *
 * @param from - The origin chain.
 * @param exchangeInput - The exchange chain or 'Auto select'.
 * @returns An array of supported assets.
 */
export const getSupportedAssetsFrom = (
  from: TChain | undefined,
  exchangeInput: TExchangeInput,
): TAssetInfo[] => getSupportedAssetsFromImpl(from, exchangeInput);
