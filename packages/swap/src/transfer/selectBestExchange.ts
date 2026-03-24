import type ExchangeChain from '../exchanges/ExchangeChain';
import type { TCommonRouterOptions, TTransformedOptions } from '../types';
import { calculateFromExchangeFee } from './createSwapTx';
import { selectBestExchangeCommon } from './selectBestExchangeCommon';
import { determineFeeCalcAddress } from './utils';

export const selectBestExchange = async <TApi, TRes, TSigner>(
  options: TCommonRouterOptions<TApi, TRes, TSigner>,
  originApi: TApi | undefined,
  isForFeeEstimation?: boolean,
): Promise<ExchangeChain> => {
  const { api } = options;
  return selectBestExchangeCommon(
    options,
    originApi,
    async (dex, assetFromExchange, assetTo, options, parsedAmount) => {
      const modifiedOptions: TTransformedOptions<
        TCommonRouterOptions<TApi, TRes, TSigner>,
        TApi,
        TRes,
        TSigner
      > = {
        ...options,
        amount: BigInt(parsedAmount),
        exchange: {
          apiPjs: await dex.createApiInstance(),
          apiPapi: await dex.createApiInstancePapi(),
          api: await api.createApiForChain(dex.chain),
          baseChain: dex.chain,
          exchangeChain: dex.exchangeChain,
          assetFrom: assetFromExchange,
          assetTo,
        },
        feeCalcAddress: determineFeeCalcAddress(options.sender, options.recipient),
      };
      const toDestTxFee = await calculateFromExchangeFee(modifiedOptions);

      const { amountOut } = await dex.handleMultiSwap(
        modifiedOptions.exchange.apiPjs,
        {
          ...modifiedOptions,
          papiApi: modifiedOptions.exchange.apiPapi,
          assetFrom: modifiedOptions.exchange.assetFrom,
          assetTo: modifiedOptions.exchange.assetTo,
          isForFeeEstimation,
        },
        toDestTxFee,
      );
      return amountOut;
    },
  );
};
