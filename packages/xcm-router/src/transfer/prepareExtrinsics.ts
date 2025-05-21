import type ExchangeNode from '../dexNodes/DexNode';
import type { TBuildTransactionsOptionsModified } from '../types';
import type { TPreparedExtrinsics } from '../types';
import { createSwapTx } from './createSwapTx';
import { buildFromExchangeExtrinsic, buildToExchangeExtrinsic } from './utils';

export const prepareExtrinsics = async (
  dex: ExchangeNode,
  options: TBuildTransactionsOptionsModified,
): Promise<TPreparedExtrinsics> => {
  const { origin, exchange, destination, senderAddress } = options;

  // 1. Create transfer origin -> exchange (optional)
  const toExchangeTx =
    origin && origin.node !== exchange.baseNode
      ? await buildToExchangeExtrinsic({ ...options, origin })
      : undefined;

  // 2. Create swap in DEX (always)
  const { txs: swapTxs, amountOut } = await createSwapTx(dex, options);

  // 3. Create transfer exchange -> destination (optional)
  const toDestTx =
    destination && destination.node !== exchange.baseNode
      ? await buildFromExchangeExtrinsic({
          exchange,
          destination,
          amount: amountOut,
          senderAddress,
        })
      : undefined;

  return { toExchangeTx, swapTxs, toDestTx, amountOut: BigInt(amountOut) };
};
