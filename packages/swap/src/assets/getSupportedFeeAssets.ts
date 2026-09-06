import type { TAssetInfo, TChain, TCustomCtx, TExchangeInput } from '@paraspell/sdk-core';

import { getSupportedAssetsFromImpl } from './getSupportedAssetsFrom';

export const getSupportedFeeAssetsImpl = <TCustomChain extends string = never>(
  from: TChain | TCustomChain | undefined,
  exchangeInput: TExchangeInput,
  ctx?: TCustomCtx,
): TAssetInfo[] =>
  getSupportedAssetsFromImpl(from, exchangeInput, ctx).filter((asset) => asset.isFeeAsset);

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
