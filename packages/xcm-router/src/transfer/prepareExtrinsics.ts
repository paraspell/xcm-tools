import type { TAsset, WithAmount } from '@paraspell/sdk';
import { handleSwapExecuteTransfer } from '@paraspell/sdk';

import type ExchangeNode from '../dexNodes/DexNode';
import type { TBuildTransactionsOptionsModified } from '../types';
import type { TPreparedExtrinsics } from '../types';
import { createSwapTx } from './createSwapTx';
import { buildFromExchangeExtrinsic, buildToExchangeExtrinsic } from './utils';

export const prepareExtrinsics = async (
  dex: ExchangeNode,
  options: TBuildTransactionsOptionsModified,
): Promise<TPreparedExtrinsics> => {
  const { origin, exchange, destination, amount, senderAddress, recipientAddress } = options;

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

  if ((origin || destination) && (dex.node.includes('AssetHub') || dex.node === 'Hydration')) {
    const tx = await handleSwapExecuteTransfer({
      chain: origin?.node,
      exchangeChain: exchange.baseNode,
      destChain: destination?.node,
      assetFrom: {
        ...(origin?.assetFrom ?? exchange.assetFrom),
        amount: BigInt(amount),
      } as WithAmount<TAsset>,
      assetTo: { ...exchange.assetTo, amount: BigInt(amountOut) } as WithAmount<TAsset>,
      senderAddress,
      recipientAddress: recipientAddress ?? senderAddress,
      calculateMinAmountOut: (amountIn: bigint, assetTo?: TAsset) =>
        dex.getAmountOut(exchange.api, {
          ...options,
          amount: amountIn.toString(),
          papiApi: options.exchange.apiPapi,
          assetFrom: options.exchange.assetFrom,
          assetTo: assetTo ?? options.exchange.assetTo,
        }),
    });
    return { swapTxs: [tx], amountOut: BigInt(amountOut) };
  }

  return { toExchangeTx, swapTxs, toDestTx, amountOut: BigInt(amountOut) };
};
