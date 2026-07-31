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

const filterFeeAssets = <TCustomChain extends string>(
  supportedAssets: TAssetInfo[],
  chain: TChain | TCustomChain,
  ctx?: TCustomCtx,
): TAssetInfo[] => {
  const chainAssets = getAssetsImpl(chain, ctx);
  return supportedAssets.filter((asset) =>
    chainAssets.some((chainAsset) => chainAsset.isFeeAsset && isAssetEqual(asset, chainAsset)),
  );
};

const deduplicateAssets = (assets: TAssetInfo[]): TAssetInfo[] =>
  assets.filter(
    (asset, index) =>
      assets.findIndex(
        (candidate) => candidate.symbol === asset.symbol && isAssetEqual(candidate, asset),
      ) === index,
  );

export const getSupportedFeeAssetsImpl = <TCustomChain extends string = never>(
  from: TChain | TCustomChain | undefined,
  exchangeInput: TExchangeInput,
  ctx?: TCustomCtx,
): TAssetInfo[] => {
  const exchange = normalizeExchange(exchangeInput);

  if (from !== undefined) {
    return filterFeeAssets(getSupportedAssetsFromImpl(from, exchange, ctx), from, ctx);
  }

  const exchanges =
    exchange === undefined ? EXCHANGE_CHAINS : Array.isArray(exchange) ? exchange : [exchange];

  return deduplicateAssets(
    exchanges.flatMap((currentExchange) => {
      const chain = createExchangeInstance(currentExchange).chain;
      const supportedAssets = getSupportedAssetsFromImpl(undefined, currentExchange, ctx);
      return filterFeeAssets(supportedAssets, chain, ctx);
    }),
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
