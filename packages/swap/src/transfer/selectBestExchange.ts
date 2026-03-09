import type { PolkadotClient } from 'polkadot-api';

import type ExchangeChain from '../exchanges/ExchangeChain';
import type { TCommonRouterOptions, TRouterBuilderOptions, TTransformedOptions } from '../types';
import { calculateFromExchangeFee } from './createSwapTx';
import { selectBestExchangeCommon } from './selectBestExchangeCommon';
import { determineFeeCalcAddress } from './utils';

export const selectBestExchange = async (
  options: TCommonRouterOptions,
  originApi: PolkadotClient | undefined,
  builderOptions?: TRouterBuilderOptions,
  isForFeeEstimation?: boolean,
): Promise<ExchangeChain> =>
  selectBestExchangeCommon(
    options,
    originApi,
    async (dex, assetFromExchange, assetTo, options) => {
      const modifiedOptions: TTransformedOptions<TCommonRouterOptions> = {
        ...options,
        amount: BigInt(options.amount),
        exchange: {
          api: await dex.createApiInstance(),
          apiPapi: await dex.createApiInstancePapi(),
          baseChain: dex.chain,
          exchangeChain: dex.exchangeChain,
          assetFrom: assetFromExchange,
          assetTo,
        },
        feeCalcAddress: determineFeeCalcAddress(options.senderAddress, options.recipientAddress),
      };
      const toDestTxFee = await calculateFromExchangeFee(modifiedOptions);

      const { amountOut } = await dex.swapCurrency(
        modifiedOptions.exchange.api,
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
    builderOptions,
  );
