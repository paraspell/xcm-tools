import { createDexNodeInstance } from '../dexNodes/DexNodeFactory';
import type { TGetBestAmountOutOptions, TGetBestAmountOutResult } from '../types';
import { selectBestExchangeAmountOut } from './selectBestExchangeAmountOut';
import { resolveAssets } from './utils/resolveAssets';

export const getBestAmountOut = async (
  options: TGetBestAmountOutOptions,
): Promise<TGetBestAmountOutResult> => {
  const { exchange, amount } = options;

  const dex =
    exchange !== undefined && !Array.isArray(exchange)
      ? createDexNodeInstance(exchange)
      : await selectBestExchangeAmountOut(options);

  const { assetFromExchange: assetFrom, assetTo } = resolveAssets(dex, options);

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
