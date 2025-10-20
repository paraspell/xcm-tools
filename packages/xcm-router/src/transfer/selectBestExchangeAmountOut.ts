import type { TPapiApi } from '@paraspell/sdk';

import type { TGetBestAmountOutOptions, TRouterBuilderOptions } from '../types';
import { selectBestExchangeCommon } from './selectBestExchangeCommon';

export const selectBestExchangeAmountOut = async (
  options: TGetBestAmountOutOptions,
  originApi: TPapiApi | undefined,
  builderOptions?: TRouterBuilderOptions,
) =>
  selectBestExchangeCommon(
    options,
    originApi,
    async (dex, assetFromExchange, assetTo, options) => {
      const api = await dex.createApiInstance();
      const papiApi = await dex.createApiInstancePapi();
      return dex.getAmountOut(api, {
        papiApi,
        assetFrom: assetFromExchange,
        assetTo,
        amount: BigInt(options.amount),
      });
    },
    builderOptions,
  );
