import type { TAssetInfo, TCustomCtx, TExchangeInput } from '@paraspell/sdk-core';
import {
  EXCHANGE_CHAINS,
  getSupportedAssetsImpl,
  isAssetEqual,
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

  const exchanges =
    exchange === undefined ? EXCHANGE_CHAINS : Array.isArray(exchange) ? exchange : [exchange];

  return exchanges.flatMap((ex) => {
    const exchangeAssets = getExchangeAssets(ex);

    if (!to || to === ex) return exchangeAssets;

    const transferableAssets = getSupportedAssetsImpl(ex, to, ctx);
    return exchangeAssets.filter((asset) =>
      transferableAssets.some((transferable) => isAssetEqual(transferable, asset)),
    );
  });
};

/**
 * Retrieves the list of assets supported for transfer from the exchange chain to the destination chain.
 *
 * @param exchangeInput - The exchange chain or 'Auto select'.
 * @param to - The destination chain.
 * @returns An array of supported assets.
 */
export const getSupportedAssetsTo = (
  exchangeInput: TExchangeInput,
  to: TChain | undefined,
): TAssetInfo[] => getSupportedAssetsToImpl(exchangeInput, to);
