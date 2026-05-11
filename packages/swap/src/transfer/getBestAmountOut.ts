import {
  applyDecimalAbstraction,
  convertBuilderConfig,
  createChainClient,
} from '@paraspell/sdk-core';

import { createExchangeInstance } from '../exchanges/ExchangeChainFactory';
import type { TGetBestAmountOutOptions, TGetBestAmountOutResult } from '../types';
import { canBuildToExchangeTx } from './canBuildToExchangeTx';
import { selectBestExchangeAmountOut } from './selectBestExchangeAmountOut';
import { buildExchangeApiVariant } from './utils/buildExchangeApiVariant';
import { resolveAssets } from './utils/resolveAssets';

export const getBestAmountOut = async <TApi, TRes, TSigner>(
  options: TGetBestAmountOutOptions<TApi, TRes, TSigner>,
): Promise<TGetBestAmountOutResult> => {
  const { api, exchange, amount, from } = options;

  const originApi = from ? await createChainClient(api, from) : undefined;

  const isExchangeAutoSelect = exchange === undefined || Array.isArray(exchange);

  const dex = isExchangeAutoSelect
    ? await selectBestExchangeAmountOut(options, originApi)
    : createExchangeInstance(exchange);

  const { assetFromOrigin, assetFromExchange: assetFrom, assetTo } = resolveAssets(dex, options);

  if (!isExchangeAutoSelect) {
    const res = await canBuildToExchangeTx(options, dex.chain, originApi, assetFromOrigin);
    if (!res.success) {
      throw res.error;
    }
  }

  const { config } = api;
  const exchangeConfig = convertBuilderConfig<TApi>(config);
  const exchangeApi = await api.createApiForChain(dex.chain);

  return {
    exchange: dex.chain,
    amountOut: await dex.getAmountOut({
      ...(await buildExchangeApiVariant(dex, exchangeConfig)),
      api: exchangeApi,
      assetFrom,
      assetTo,
      amount: applyDecimalAbstraction(
        amount,
        assetFromOrigin?.decimals ?? assetFrom.decimals,
        exchangeConfig?.abstractDecimals !== false,
      ),
    }),
  };
};
