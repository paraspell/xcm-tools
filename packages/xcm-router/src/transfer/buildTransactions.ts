import type ExchangeChain from '../exchanges/ExchangeChain';
import type { TBuildTransactionsOptionsModified, TRouterPlan } from '../types';
import { prepareExtrinsics } from './prepareExtrinsics';

export const buildTransactions = async (
  dex: ExchangeChain,
  options: TBuildTransactionsOptionsModified,
): Promise<TRouterPlan> => {
  const { origin, exchange, destination } = options;

  const { toExchangeTx, swapTxs, toDestTx, amountOut, isExecute } = await prepareExtrinsics(
    dex,
    options,
  );

  const transactions: TRouterPlan = [];

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
    const batchedTx = exchange.apiPapi.getUnsafeApi().tx.Utility.batch_all({
      calls: [...swapTxs.map((tx) => tx.decodedCall), toDestTx.decodedCall],
    });

    transactions.push({
      api: exchange.apiPapi,
      chain: dex.chain,
      destinationChain: destination?.chain,
      tx: batchedTx,
      type: 'SWAP_AND_TRANSFER',
    });
  } else {
    if (swapTxs.length === 1) {
      transactions.push({
        api: exchange.apiPapi,
        chain: isExecute ? (origin?.chain ?? dex.chain) : dex.chain,
        tx: swapTxs[0],
        amountOut: BigInt(amountOut),
        type: 'SWAP',
      });
    } else {
      const batchedSwapTx = exchange.apiPapi.getUnsafeApi().tx.Utility.batch_all({
        calls: swapTxs.map((tx) => tx.decodedCall),
      });

      transactions.push({
        api: exchange.apiPapi,
        chain: dex.chain,
        tx: batchedSwapTx,
        amountOut: BigInt(amountOut),
        type: 'SWAP',
      });
    }
  }

  return transactions;
};
