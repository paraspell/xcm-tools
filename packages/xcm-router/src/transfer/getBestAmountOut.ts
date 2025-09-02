import { applyDecimalAbstraction, createChainClient } from '@paraspell/sdk';

import { createExchangeInstance } from '../exchanges/ExchangeChainFactory';
import type {
  TGetBestAmountOutOptions,
  TGetBestAmountOutResult,
  TRouterBuilderOptions,
} from '../types';
import { canBuildToExchangeTx } from './canBuildToExchangeTx';
import { selectBestExchangeAmountOut } from './selectBestExchangeAmountOut';
import { resolveAssets } from './utils/resolveAssets';

export const getBestAmountOut = async (
  options: TGetBestAmountOutOptions,
  builderOptions?: TRouterBuilderOptions,
): Promise<TGetBestAmountOutResult> => {
  const { exchange, amount, from } = options;

  const originApi = from ? await createChainClient(from) : undefined;

  const isExchangeAutoSelect = exchange === undefined || Array.isArray(exchange);

  const dex = isExchangeAutoSelect
    ? await selectBestExchangeAmountOut(options, originApi, builderOptions)
    : createExchangeInstance(exchange);

  const { assetFromOrigin, assetFromExchange: assetFrom, assetTo } = resolveAssets(dex, options);

  if (!isExchangeAutoSelect) {
    const res = await canBuildToExchangeTx(options, dex.chain, originApi, assetFromOrigin);
    if (!res.success) {
      throw res.error;
    }
  }

  const api = await dex.createApiInstance();
  const papiApi = await dex.createApiInstancePapi();

  return {
    exchange: dex.exchangeChain,
    amountOut: await dex.getAmountOut(api, {
      papiApi,
      assetFrom,
      assetTo,
      amount: applyDecimalAbstraction(
        amount,
        assetFromOrigin?.decimals ?? assetFrom.decimals,
        !!builderOptions?.abstractDecimals,
      ).toString(),
    }),
  };
};
