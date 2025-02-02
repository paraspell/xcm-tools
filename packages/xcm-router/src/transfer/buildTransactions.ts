import type { TBuildTransactionsOptionsModified, TRouterPlan } from '../types';
import { buildFromExchangeExtrinsic, buildToExchangeExtrinsic } from './utils';
import { createSwapTx } from './createSwapTx';
import type ExchangeNode from '../dexNodes/DexNode';

export const buildTransactions = async (
  dex: ExchangeNode,
  options: TBuildTransactionsOptionsModified,
): Promise<TRouterPlan> => {
  const { origin, exchange, to } = options;

  const transactions: TRouterPlan = [];

  const toExchangeTx =
    origin && origin.node !== exchange.baseNode
      ? await buildToExchangeExtrinsic({
          ...options,
          origin,
        })
      : undefined;

  const { tx: swapTx, amountOut } = await createSwapTx(dex, options);

  const toDestTx =
    to && to !== exchange.baseNode
      ? await buildFromExchangeExtrinsic({
          ...options,
          to,
          amount: amountOut,
        })
      : undefined;

  if (origin && toExchangeTx) {
    transactions.push({
      api: origin.api,
      node: origin.node,
      destinationNode: exchange.baseNode,
      tx: toExchangeTx,
      type: 'TRANSFER',
    });
  }

  if (toDestTx) {
    const batchedTx = exchange.api.tx.utility.batch([swapTx, toDestTx]);
    transactions.push({
      api: exchange.api,
      node: dex.node,
      destinationNode: to,
      tx: batchedTx,
      type: 'SWAP_AND_TRANSFER',
    });
  } else {
    transactions.push({
      api: exchange.api,
      node: dex.node,
      tx: swapTx,
      type: 'SWAP',
    });
  }

  return transactions;
};
