import {
  applyDecimalAbstraction,
  convertBuilderConfig,
  createChainClient,
} from '@paraspell/sdk-core';

import { createExchangeInstance } from '../exchanges/ExchangeChainFactory';
import type { TGetBestAmountOutOptions, TGetBestAmountOutResult } from '../types';
import { canBuildToExchangeTx } from './canBuildToExchangeTx';
import { selectBestExchangeAmountOut } from './selectBestExchangeAmountOut';
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

  const config = api.getConfig();
  const exchangeConfig = convertBuilderConfig<TApi>(config);
  const pjsApi = await dex.createApiInstance(exchangeConfig);
  const papiApi = await dex.createApiInstancePapi(exchangeConfig);

  return {
    exchange: dex.exchangeChain,
    amountOut: await dex.getAmountOut(pjsApi, {
      papiApi,
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
