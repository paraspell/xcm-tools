import type { TPapiApi } from '@paraspell/sdk';
import BigNumber from 'bignumber.js';

import type { TGetBestAmountOutOptions } from '../types';
import { selectBestExchangeCommon } from './selectBestExchangeCommon';

export const selectBestExchangeAmountOut = async (
  options: TGetBestAmountOutOptions,
  originApi: TPapiApi | undefined,
) =>
  selectBestExchangeCommon(options, originApi, async (dex, assetFromExchange, assetTo, options) => {
    const api = await dex.createApiInstance();
    const papiApi = await dex.createApiInstancePapi();
    const bestAmountOut = await dex.getAmountOut(api, {
      papiApi,
      assetFrom: assetFromExchange,
      assetTo,
      amount: options.amount,
    });
    return new BigNumber(bestAmountOut.toString());
  });
