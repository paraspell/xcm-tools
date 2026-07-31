import type { TAssetInfo, TCustomCtx, TExchangeInput } from '@paraspell/sdk-core';
import {
  EXCHANGE_CHAINS,
  type TExchangeChain,
  getAssetsImpl,
  isAssetEqual,
  getRelayChainOf,
  isExternalChain,
  isSystemAsset,
  normalizeExchange,
  type TChain,
} from '@paraspell/sdk-core';

import { getExchangeAssets } from './getExchangeConfig';
import { createExchangeInstance } from '../exchanges/ExchangeChainFactory';

export const getSupportedAssetsToImpl = <TCustomChain extends string = never>(
  exchangeInput: TExchangeInput,
  to: TChain | TCustomChain | undefined,
  ctx?: TCustomCtx,
): TAssetInfo[] => {
  const exchange = normalizeExchange(exchangeInput);
  const isMatchingRelay = (exchangeChain: TExchangeChain) => {
    if (!to || isExternalChain(to)) return true;

    const chain = createExchangeInstance(exchangeChain).chain;
    return getRelayChainOf(to) === getRelayChainOf(chain);
  };

  const exchangeAssets = (
    exchange === undefined ? EXCHANGE_CHAINS : Array.isArray(exchange) ? exchange : [exchange]
  )
    .filter((exchangeChain) => isMatchingRelay(exchangeChain))
    .flatMap((exchangeChain) => getExchangeAssets(exchangeChain));

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
