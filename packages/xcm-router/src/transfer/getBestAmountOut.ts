import { createApiInstanceForNode } from '@paraspell/sdk';

import { createDexNodeInstance } from '../dexNodes/DexNodeFactory';
import type { TGetBestAmountOutOptions, TGetBestAmountOutResult } from '../types';
import { canBuildToExchangeTx } from './canBuildToExchangeTx';
import { selectBestExchangeAmountOut } from './selectBestExchangeAmountOut';
import { resolveAssets } from './utils/resolveAssets';

export const getBestAmountOut = async (
  options: TGetBestAmountOutOptions,
): Promise<TGetBestAmountOutResult> => {
  const { exchange, amount, from } = options;

  const originApi = from ? await createApiInstanceForNode(from) : undefined;

  const isExchangeAutoSelect = exchange === undefined || Array.isArray(exchange);

  const dex = isExchangeAutoSelect
    ? await selectBestExchangeAmountOut(options, originApi)
    : createDexNodeInstance(exchange);

  const { assetFromOrigin, assetFromExchange: assetFrom, assetTo } = resolveAssets(dex, options);

  if (!isExchangeAutoSelect) {
    const res = await canBuildToExchangeTx(options, dex.node, originApi, assetFromOrigin);
    if (!res.success) {
      throw res.error;
    }
  }

  const api = await dex.createApiInstance();

  return {
    exchange: dex.exchangeNode,
    amountOut: await dex.getAmountOut(api, {
      assetFrom,
      assetTo,
      amount,
    }),
  };
};
