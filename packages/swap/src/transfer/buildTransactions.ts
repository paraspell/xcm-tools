import { BatchMode } from '@paraspell/sdk-core';

import type ExchangeChain from '../exchanges/ExchangeChain';
import type { TBuildTransactionsOptions, TRouterPlan, TTransformedOptions } from '../types';
import { prepareExtrinsics } from './prepareExtrinsics';

export const buildTransactions = async <TApi, TRes, TSigner>(
  dex: ExchangeChain,
  options: TTransformedOptions<TBuildTransactionsOptions<TApi, TRes, TSigner>, TApi, TRes, TSigner>,
): Promise<TRouterPlan<TApi, TRes>> => {
  const { origin, exchange, destination } = options;

  const { toExchangeTx, swapTxs, toDestTx, amountOut, isExecute } = await prepareExtrinsics(
    dex,
    options,
  );

  const transactions: TRouterPlan<TApi, TRes> = [];

  if (origin && toExchangeTx) {
    transactions.push({
      api: origin.api,
      chain: origin.chain,
      destinationChain: exchange.baseChain,
      tx: toExchangeTx,
      type: 'TRANSFER',
    });
  }

  if (toDestTx) {
    const batchedTx = exchange.api.callBatchMethod([...swapTxs, toDestTx], BatchMode.BATCH_ALL);

    transactions.push({
      api: exchange.api.getApi(),
      chain: dex.chain,
      destinationChain: destination?.chain,
      tx: batchedTx,
      type: 'SWAP_AND_TRANSFER',
      amountOut,
    });
  } else {
    if (swapTxs.length === 1) {
      transactions.push({
        api: isExecute ? (origin?.api ?? exchange.api.getApi()) : exchange.api.getApi(),
        chain: isExecute ? (origin?.chain ?? dex.chain) : dex.chain,
        tx: swapTxs[0],
        amountOut,
        type: 'SWAP',
      });
    } else {
      const batchedSwapTx = exchange.api.callBatchMethod(swapTxs, BatchMode.BATCH_ALL);

      transactions.push({
        api: exchange.api.getApi(),
        chain: dex.chain,
        tx: batchedSwapTx,
        amountOut,
        type: 'SWAP',
      });
    }
  }

  return transactions;
};
