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
      const pjsApi = await dex.createApiInstance();
      const papiApi = await dex.createApiInstancePapi();
      return dex.getAmountOut(pjsApi, {
        papiApi,
        assetFrom: assetFromExchange,
        assetTo,
        amount: BigInt(parsedAmount),
      });
    },
  );
