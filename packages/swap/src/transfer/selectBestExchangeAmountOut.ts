import type { WithApi } from '@paraspell/sdk-core';

import type { TGetBestAmountOutOptions } from '../types';
import { selectBestExchangeCommon } from './selectBestExchangeCommon';

export const selectBestExchangeAmountOut = async <TApi, TRes, TSigner>(
  options: WithApi<TGetBestAmountOutOptions<TApi, TRes, TSigner>, TApi, TRes, TSigner>,
  originApi: TApi | undefined,
) =>
  selectBestExchangeCommon(
    options,
    originApi,
    async (dex, assetFromExchange, assetTo, _options, parsedAmount) => {
      const exchangeApi = await options.api.createApiForChain(dex.chain);
      const exchangePjsApi = await dex.createApiInstance();
      return dex.getAmountOut({
        api: exchangeApi,
        apiPjs: exchangePjsApi,
        assetFrom: assetFromExchange,
        assetTo,
        amount: BigInt(parsedAmount),
      });
    },
  );
