import type { TAsset } from '@paraspell/sdk-pjs';
import BigNumber from 'bignumber.js';

import type ExchangeNode from '../dexNodes/DexNode';
import { type TCommonTransferOptions, type TCommonTransferOptionsModified } from '../types';
import { calculateFromExchangeFee } from './createSwapTx';
import { selectBestExchangeCommon } from './selectBestExchangeCommon';
import { determineFeeCalcAddress } from './utils';

export const selectBestExchange = async (options: TCommonTransferOptions): Promise<ExchangeNode> =>
  selectBestExchangeCommon(options, async (dex, assetFromExchange, assetTo, options) => {
    const modifiedOptions: TCommonTransferOptionsModified = {
      ...options,
      exchange: {
        api: await dex.createApiInstance(),
        apiPapi: await dex.createApiInstancePapi(),
        baseNode: dex.node,
        exchangeNode: dex.exchangeNode,
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
        feeCalcAddress: modifiedOptions.feeCalcAddress,
        assetFrom: modifiedOptions.exchange.assetFrom as TAsset,
        assetTo: modifiedOptions.exchange.assetTo as TAsset,
      },
      toDestTxFee,
    );
    return new BigNumber(swapResult.amountOut);
  });
