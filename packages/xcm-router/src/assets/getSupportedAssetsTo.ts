import {
  getAssets,
  isAssetEqual,
  isExternalChain,
  isSystemAsset,
  type TChain,
} from '@paraspell/sdk';

import { EXCHANGE_CHAINS } from '../consts';
import type { TExchangeInput, TRouterAsset } from '../types';
import { getExchangeAssets } from './getExchangeConfig';

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
    const allExchangeAssets = EXCHANGE_CHAINS.map((exchangeChain) =>
      getExchangeAssets(exchangeChain),
    ).flat();
    if (to) {
      const toAssets = getAssets(to);

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
    const toAssets = getAssets(to);
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
