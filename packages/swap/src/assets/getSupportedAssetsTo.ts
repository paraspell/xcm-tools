import type { TAssetInfo, TCustomCtx, TExchangeInput } from '@paraspell/sdk-core';
import {
  EXCHANGE_CHAINS,
  getAssetsImpl,
  isAssetEqual,
  isExternalChain,
  isSystemAsset,
  normalizeExchange,
  type TChain,
} from '@paraspell/sdk-core';

import { getExchangeAssets } from './getExchangeConfig';

export const getSupportedAssetsToImpl = <TCustomChain extends string = never>(
  exchangeInput: TExchangeInput,
  to: TChain | TCustomChain | undefined,
  ctx?: TCustomCtx,
): TAssetInfo[] => {
  const exchange = normalizeExchange(exchangeInput);
  if (exchange === undefined) {
    const allExchangeAssets = EXCHANGE_CHAINS.map((exchangeChain) =>
      getExchangeAssets(exchangeChain),
    ).flat();
    if (to) {
      const toAssets = getAssetsImpl(to, ctx);

      const filteredExchangeAssets = allExchangeAssets.filter((asset) =>
        toAssets.some((toAsset) => isAssetEqual(asset, toAsset)),
      );
      if (isExternalChain(to)) {
        filteredExchangeAssets.push(...allExchangeAssets.filter((asset) => isSystemAsset(asset)));
      }
      return filteredExchangeAssets;
    }
    return allExchangeAssets;
  }

  const exchangeAssets = Array.isArray(exchange)
    ? exchange.flatMap((exchange) => getExchangeAssets(exchange))
    : getExchangeAssets(exchange);

  if (to) {
    const toAssets = getAssetsImpl(to, ctx);
    const filteredExchangeAssets = exchangeAssets.filter((asset) =>
      toAssets.some((toAsset) => isAssetEqual(asset, toAsset)),
    );
    if (isExternalChain(to)) {
      filteredExchangeAssets.push(...exchangeAssets.filter((asset) => isSystemAsset(asset)));
    }
    return filteredExchangeAssets;
  }

  return exchangeAssets;
};

/**
 * Retrieves the list of assets supported for transfer to the destination chain.
 *
 * @param origin - The origin chain.
 * @param exchange - The exchange chain or 'Auto select'.
 * @param to - The destination chain.
 * @returns An array of supported assets.
 */
export const getSupportedAssetsTo = (
  exchangeInput: TExchangeInput,
  to: TChain | undefined,
): TAssetInfo[] => getSupportedAssetsToImpl(exchangeInput, to);
