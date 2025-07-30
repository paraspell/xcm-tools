import { getAssets, type TChain } from '@paraspell/sdk';

import { EXCHANGE_CHAINS } from '../consts';
import type { TExchangeInput, TRouterAsset } from '../types';
import { getExchangeAssets } from './getExchangeConfig';
import { isRouterAssetEqual } from './isRouterAssetEqual';

/**
 * Retrieves the list of assets supported for transfer to the destination chain.
 *
 * @param origin - The origin chain.
 * @param exchange - The exchange chain or 'Auto select'.
 * @param to - The destination chain.
 * @returns An array of supported assets.
 */
export const getSupportedAssetsTo = (
  exchange: TExchangeInput,
  to: TChain | undefined,
): TRouterAsset[] => {
  if (exchange === undefined) {
    let allExchangeAssets = EXCHANGE_CHAINS.map((exchangeChain) =>
      getExchangeAssets(exchangeChain),
    ).flat();
    if (to) {
      const toAssets = getAssets(to);

      allExchangeAssets = allExchangeAssets.filter((asset) =>
        toAssets.some((toAsset) => isRouterAssetEqual(asset, toAsset)),
      );
    }
    return allExchangeAssets;
  }

  let exchangeAssets = Array.isArray(exchange)
    ? exchange.flatMap((exchange) => getExchangeAssets(exchange))
    : getExchangeAssets(exchange);

  if (to) {
    const toAssets = getAssets(to);
    exchangeAssets = exchangeAssets.filter((asset) =>
      toAssets.some((toAsset) => isRouterAssetEqual(asset, toAsset)),
    );
  }

  return exchangeAssets;
};
