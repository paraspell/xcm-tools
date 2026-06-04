import { convertBuilderConfig } from '@paraspell/sdk-core';

import type ExchangeChain from '../exchanges/ExchangeChain';
import type { TCommonRouterOptions, TExchangeInfo, TTransformedOptions } from '../types';
import { calculateFromExchangeFee } from './createSwapTx';
import { selectBestExchangeCommon } from './selectBestExchangeCommon';
import { buildExchangeApiVariant, pickExchangeApiVariant } from './utils/buildExchangeApiVariant';
import { determineFeeCalcAddress } from './utils/utils';

export const selectBestExchange = async <TApi, TRes, TSigner, TCustomChain extends string = never>(
  options: TCommonRouterOptions<TApi, TRes, TSigner, TCustomChain>,
  originApi: TApi | undefined,
  isForFeeEstimation?: boolean,
): Promise<ExchangeChain> => {
  const { api } = options;
  const exchangeConfig = convertBuilderConfig<TApi>(api.config);
  return selectBestExchangeCommon(
    options,
    originApi,
    async (dex, assetFromExchange, assetTo, options, parsedAmount) => {
      const exchangeInfo: TExchangeInfo<TApi, TRes, TSigner, TCustomChain> = {
        ...(await buildExchangeApiVariant(dex, exchangeConfig)),
        api: await api.createApiForChain(dex.chain),
        chain: dex.chain,
        assetFrom: assetFromExchange,
        assetTo,
      };
      const modifiedOptions: TTransformedOptions<
        TCommonRouterOptions<TApi, TRes, TSigner, TCustomChain>,
        TApi,
        TRes,
        TSigner,
        TCustomChain
      > = {
        ...options,
        amount: BigInt(parsedAmount),
        exchange: exchangeInfo,
        feeCalcAddress: determineFeeCalcAddress(options.sender, options.recipient),
      };
      const toDestTxFee = await calculateFromExchangeFee(modifiedOptions);

      const { amountOut } = await dex.handleMultiSwap(
        {
          ...modifiedOptions,
          ...pickExchangeApiVariant(modifiedOptions.exchange),
          api: modifiedOptions.exchange.api,
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
