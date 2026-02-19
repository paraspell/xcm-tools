import type { TAssetInfo, TChain } from '@paraspell/sdk';
import { getAssets, isAssetEqual } from '@paraspell/sdk';

import { EXCHANGE_CHAINS } from '../consts';
import { createExchangeInstance } from '../exchanges/ExchangeChainFactory';
import type { TExchangeInput } from '../types';
import { getSupportedAssetsFrom } from './getSupportedAssetsFrom';

/**
 * Retrieves the list of assets that can be used to pay for fees on the origin chain.
 *
 * @param from - The origin chain.
 * @param exchange - The exchange chain or 'Auto select'.
 * @returns An array of fee-eligible assets.
 */
export const getSupportedFeeAssets = (
  from: TChain | undefined,
  exchange: TExchangeInput,
): TAssetInfo[] => {
  const supportedAssets = getSupportedAssetsFrom(from, exchange);

  const chains = from
    ? [from]
    : (exchange === undefined
        ? [...EXCHANGE_CHAINS]
        : Array.isArray(exchange)
          ? exchange
          : [exchange]
      )
        .map((ex) => createExchangeInstance(ex).chain)
        .filter((chain, i, arr) => arr.indexOf(chain) === i);

  const chainAssets = chains.flatMap((chain) => getAssets(chain));

  return supportedAssets.filter((asset) =>
    chainAssets.some((chainAsset) => chainAsset.isFeeAsset && isAssetEqual(asset, chainAsset)),
  );
};
