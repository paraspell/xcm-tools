import type { TGetBestAmountOutOptions } from '../types';
import BigNumber from 'bignumber.js';
import { selectBestExchangeCommon } from './selectBestExchangeCommon';

export const selectBestExchangeAmountOut = async (options: TGetBestAmountOutOptions) =>
  selectBestExchangeCommon(options, async (dex, assetFromExchange, assetTo, options) => {
    const api = await dex.createApiInstance();
    const bestAmountOut = await dex.getAmountOut(api, {
      assetFrom: assetFromExchange,
      assetTo,
      amount: options.amount,
    });
    return new BigNumber(bestAmountOut.toString());
  });
