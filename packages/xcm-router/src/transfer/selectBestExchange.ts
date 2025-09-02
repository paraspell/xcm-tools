import BigNumber from 'bignumber.js';
import type { PolkadotClient } from 'polkadot-api';

import type ExchangeChain from '../exchanges/ExchangeChain';
import type { TRouterBuilderOptions } from '../types';
import { type TCommonTransferOptions, type TCommonTransferOptionsModified } from '../types';
import { calculateFromExchangeFee } from './createSwapTx';
import { selectBestExchangeCommon } from './selectBestExchangeCommon';
import { determineFeeCalcAddress } from './utils';

export const selectBestExchange = async (
  options: TCommonTransferOptions,
  originApi: PolkadotClient | undefined,
  builderOptions?: TRouterBuilderOptions,
): Promise<ExchangeChain> =>
  selectBestExchangeCommon(
    options,
    originApi,
    async (dex, assetFromExchange, assetTo, options) => {
      const modifiedOptions: TCommonTransferOptionsModified = {
        ...options,
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

      const swapResult = await dex.swapCurrency(
        modifiedOptions.exchange.api,
        {
          ...modifiedOptions,
          papiApi: modifiedOptions.exchange.apiPapi,
          assetFrom: modifiedOptions.exchange.assetFrom,
          assetTo: modifiedOptions.exchange.assetTo,
        },
        toDestTxFee,
      );
      return new BigNumber(swapResult.amountOut);
    },
    builderOptions,
  );
