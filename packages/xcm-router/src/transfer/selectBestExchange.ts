import { createApiInstanceForNode } from '@paraspell/sdk';
import { EXCHANGE_NODES } from '../consts/consts';
import createDexNodeInstance from '../dexNodes/DexNodeFactory';
import {
  type TExchangeNode,
  type TAssetsRecord,
  type TCommonTransferOptionsModified,
  type TCommonTransferOptions,
} from '../types';
import { calculateTransactionFee } from '../utils/utils';
import { buildFromExchangeExtrinsic, buildToExchangeExtrinsic } from './utils';
import BigNumber from 'bignumber.js';
import type ExchangeNode from '../dexNodes/DexNode';
import * as assetsMapJson from '../consts/assets.json' assert { type: 'json' };
import Logger from '../Logger/Logger';

const assetsMap = assetsMapJson as TAssetsRecord;

const supportsCurrency = (exchangeNode: TExchangeNode, currency: string): boolean => {
  return assetsMap[exchangeNode].some((asset) => asset === currency);
};

export const selectBestExchange = async (
  options: TCommonTransferOptions,
): Promise<ExchangeNode> => {
  const { from, amount, injectorAddress, currencyFrom, currencyTo } = options;
  Logger.log(`Selecting best exchange for ${currencyFrom} -> ${currencyTo}`);
  let bestExchange: ExchangeNode | undefined;
  let maxAmountOut: BigNumber = new BigNumber(0);
  let lastError: Error | undefined;
  for (const exchangeNode of EXCHANGE_NODES) {
    const dex = createDexNodeInstance(exchangeNode);

    if (
      !supportsCurrency(exchangeNode, currencyFrom) ||
      !supportsCurrency(exchangeNode, currencyTo)
    ) {
      continue;
    }

    Logger.log(`Checking ${exchangeNode}...`);

    const modifiedOptions: TCommonTransferOptionsModified = { ...options, exchange: dex.node };
    const originApi = await createApiInstanceForNode(from);
    const swapApi = await dex.createApiInstance();
    try {
      const toDestTx = await buildFromExchangeExtrinsic(swapApi, modifiedOptions, amount);
      const toDestTransactionFee = await calculateTransactionFee(toDestTx, injectorAddress);
      const toExchangeTx = await buildToExchangeExtrinsic(originApi, modifiedOptions);
      const toExchangeTransactionFee = await calculateTransactionFee(toExchangeTx, injectorAddress);
      const swapResult = await dex.swapCurrency(
        swapApi,
        options,
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
        lastError = e;
      }
      continue;
    }
  }
  if (bestExchange === undefined) {
    throw new Error(
      `Could not select best exchange automatically. Please specify one manually. Last erorr: ${
        lastError !== undefined ? lastError.message : 'None'
      }`,
    );
  }
  Logger.log(`Selected exchange: ${bestExchange.node}`);
  return bestExchange;
};
