import { BatchMode } from '@paraspell/sdk-core';

import type ExchangeChain from '../exchanges/ExchangeChain';
import type { TBuildTransactionsOptions, TRouterPlan, TTransformedOptions } from '../types';
import { prepareExtrinsics } from './prepareExtrinsics';

export const buildTransactions = async <TApi, TRes, TSigner, TCustomChain extends string = never>(
  dex: ExchangeChain,
  options: TTransformedOptions<
    TBuildTransactionsOptions<TApi, TRes, TSigner, TCustomChain>,
    TApi,
    TRes,
    TSigner,
    TCustomChain
  >,
): Promise<TRouterPlan<TApi, TRes>> => {
  const { origin, exchange, destination } = options;

  const { toExchangeTx, swapTx, toDestTx, amountOut, isExecute } = await prepareExtrinsics(
    dex,
    options,
  );

  const transactions: TRouterPlan<TApi, TRes> = [];

  if (origin && toExchangeTx) {
    transactions.push({
      api: origin.api,
      chain: origin.chain,
      destinationChain: exchange.chain,
      tx: toExchangeTx,
      type: 'TRANSFER',
    });
  }

  if (toDestTx) {
    const batchedTx = exchange.api.callBatchMethod([swapTx, toDestTx], BatchMode.BATCH_ALL);

    transactions.push({
      api: exchange.api.api,
      chain: dex.chain,
      destinationChain: destination?.chain,
      tx: batchedTx,
      type: 'SWAP_AND_TRANSFER',
      amountOut,
    });
  } else {
    transactions.push({
      api: isExecute ? (origin?.api ?? exchange.api.api) : exchange.api.api,
      chain: isExecute ? (origin?.chain ?? dex.chain) : dex.chain,
      tx: swapTx,
      amountOut,
      type: 'SWAP',
    });
  }

  return transactions;
};
