import type ExchangeNode from '../dexNodes/DexNode';
import type { TBuildTransactionsOptionsModified, TRouterPlan } from '../types';
import { prepareExtrinsics } from './prepareExtrinsics';

export const buildTransactions = async (
  dex: ExchangeNode,
  options: TBuildTransactionsOptionsModified,
): Promise<TRouterPlan> => {
  const { origin, exchange, destination } = options;

  const { toExchangeTx, swapTx, toDestTx, amountOut } = await prepareExtrinsics(dex, options);

  const transactions: TRouterPlan = [];

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
    const batchedTx = exchange.apiPapi
      .getUnsafeApi()
      .tx.Utility.batch_all({ calls: [swapTx.decodedCall, toDestTx.decodedCall] });

    transactions.push({
      api: exchange.apiPapi,
      node: dex.node,
      destinationNode: destination?.node,
      tx: batchedTx,
      type: 'SWAP_AND_TRANSFER',
    });
  } else {
    transactions.push({
      api: exchange.apiPapi,
      node: dex.node,
      tx: swapTx,
      amountOut: BigInt(amountOut),
      type: 'SWAP',
    });
  }

  return transactions;
};
