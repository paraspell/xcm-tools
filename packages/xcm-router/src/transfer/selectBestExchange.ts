import { type TNode, createApiInstanceForNode } from '@paraspell/sdk';
import { EXCHANGE_NODES } from '../consts/consts';
import createDexNodeInstance from '../dexNodes/DexNodeFactory';
import { type TCommonTransferOptionsModified, type TCommonTransferOptions } from '../types';
import { calculateTransactionFee } from '../utils/utils';
import {
  buildFromExchangeExtrinsic,
  buildToExchangeExtrinsic,
  determineFeeCalcAddress,
} from './utils';
import BigNumber from 'bignumber.js';
import type ExchangeNode from '../dexNodes/DexNode';
import Logger from '../Logger/Logger';
import { supportsCurrency } from '../assets/assets';

export const selectBestExchange = async (
  options: TCommonTransferOptions,
): Promise<ExchangeNode> => {
  const { from, amount, currencyFrom, currencyTo } = options;
  Logger.log(`Selecting best exchange for ${currencyFrom} -> ${currencyTo}`);
  let bestExchange: ExchangeNode | undefined;
  let maxAmountOut: BigNumber = new BigNumber(0);
  const errors = new Map<TNode, Error>();
  for (const exchangeNode of EXCHANGE_NODES) {
    const dex = createDexNodeInstance(exchangeNode);

    if (
      !supportsCurrency(exchangeNode, currencyFrom) ||
      !supportsCurrency(exchangeNode, currencyTo)
    ) {
      continue;
    }

    Logger.log(`Checking ${exchangeNode}...`);

    const modifiedOptions: TCommonTransferOptionsModified = {
      ...options,
      exchange: dex.node,
      feeCalcAddress: determineFeeCalcAddress(options.injectorAddress, options.recipientAddress),
    };
    const originApi = await createApiInstanceForNode(from);
    const swapApi = await dex.createApiInstance();
    try {
      const toDestTx = await buildFromExchangeExtrinsic(swapApi, modifiedOptions, amount);
      const toDestTransactionFee = await calculateTransactionFee(
        toDestTx,
        modifiedOptions.feeCalcAddress,
      );
      const toExchangeTx = await buildToExchangeExtrinsic(originApi, modifiedOptions);
      const toExchangeTransactionFee = await calculateTransactionFee(
        toExchangeTx,
        modifiedOptions.feeCalcAddress,
      );
      const swapResult = await dex.swapCurrency(
        swapApi,
        {
          ...modifiedOptions,
          feeCalcAddress: modifiedOptions.feeCalcAddress,
        },
        toDestTransactionFee,
        toExchangeTransactionFee,
      );
      const amountOut = new BigNumber(swapResult.amountOut);
      if (amountOut.gt(maxAmountOut)) {
        bestExchange = dex;
        maxAmountOut = amountOut;
      }
    } catch (e) {
      if (e instanceof Error) {
        errors.set(dex.node, e);
      }
      continue;
    }
  }
  if (bestExchange === undefined) {
    throw new Error(
      `Could not select best exchange automatically. Please specify one manually. Errors: \n\n${Array.from(
        errors.entries(),
      )
        .map(([key, value]) => `${key}: ${value.message}`)
        .join('\n\n')}`,
    );
  }
  Logger.log(`Selected exchange: ${bestExchange.node}`);
  return bestExchange;
};
