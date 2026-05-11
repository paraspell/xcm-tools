import { convertBuilderConfig, type WithApi } from '@paraspell/sdk-core';

import type { TGetBestAmountOutOptions } from '../types';
import { selectBestExchangeCommon } from './selectBestExchangeCommon';
import { buildExchangeApiVariant } from './utils/buildExchangeApiVariant';

export const selectBestExchangeAmountOut = async <TApi, TRes, TSigner>(
  options: WithApi<TGetBestAmountOutOptions<TApi, TRes, TSigner>, TApi, TRes, TSigner>,
  originApi: TApi | undefined,
) => {
  const exchangeConfig = convertBuilderConfig<TApi>(options.api.config);
  return selectBestExchangeCommon(
    options,
    originApi,
    async (dex, assetFromExchange, assetTo, _options, parsedAmount) => {
      const exchangeApi = await options.api.createApiForChain(dex.chain);
      return dex.getAmountOut({
        ...(await buildExchangeApiVariant(dex, exchangeConfig)),
        api: exchangeApi,
        assetFrom: assetFromExchange,
        assetTo,
        amount: BigInt(parsedAmount),
      });
    },
  );
};
