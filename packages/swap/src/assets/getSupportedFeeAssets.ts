import {
  EXCHANGE_CHAINS,
  getAssetsImpl,
  isAssetEqual,
  normalizeExchange,
  type TAssetInfo,
  type TChain,
  type TCustomCtx,
  type TExchangeInput,
} from '@paraspell/sdk-core';

import { createExchangeInstance } from '../exchanges/ExchangeChainFactory';
import { getSupportedAssetsFromImpl } from './getSupportedAssetsFrom';

export const getSupportedFeeAssetsImpl = <TCustomChain extends string = never>(
  from: TChain | TCustomChain | undefined,
  exchangeInput: TExchangeInput,
  ctx?: TCustomCtx,
): TAssetInfo[] => {
  const exchange = normalizeExchange(exchangeInput);
  const supportedAssets = getSupportedAssetsFromImpl(from, exchange, ctx);

  if (!from && Array.isArray(exchange)) {
    const supportedByExchange = exchange.flatMap((exchangeChain) => {
      const chain = createExchangeInstance(exchangeChain).chain;
      const chainFeeAssets = getAssetsImpl(chain, ctx).filter((asset) => asset.isFeeAsset);

      return getSupportedAssetsFromImpl(undefined, exchangeChain, ctx).filter((asset) =>
        chainFeeAssets.some((chainAsset) => isAssetEqual(asset, chainAsset)),
      );
    });

    const uniqueSupported = new Map<string, TAssetInfo>();
    for (const asset of supportedByExchange) {
      const key = JSON.stringify([asset.location, asset.symbol, asset.assetId]);
      uniqueSupported.set(key, asset);
    }
    return [...uniqueSupported.values()];
  }

  const chains = from
    ? [from]
    : (exchange === undefined ? EXCHANGE_CHAINS : Array.isArray(exchange) ? exchange : [exchange])
        .map((ex) => createExchangeInstance(ex).chain)
        .filter((chain, i, arr) => arr.indexOf(chain) === i);

  const chainAssets = chains.flatMap((chain) => getAssetsImpl(chain, ctx));

  return supportedAssets.filter((asset) =>
    chainAssets.some((chainAsset) => chainAsset.isFeeAsset && isAssetEqual(asset, chainAsset)),
  );
};

/**
 * Retrieves the list of assets that can be used to pay for fees on the origin chain.
 *
 * @param from - The origin chain.
 * @param exchange - The exchange chain or 'Auto select'.
 * @returns An array of fee-eligible assets.
 */
export const getSupportedFeeAssets = (
  from: TChain | undefined,
  exchangeInput: TExchangeInput,
): TAssetInfo[] => getSupportedFeeAssetsImpl(from, exchangeInput);
