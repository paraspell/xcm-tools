import type { TAssetInfo, WithAmount } from '@paraspell/sdk';
import { DryRunFailedError, handleSwapExecuteTransfer } from '@paraspell/sdk';

import type ExchangeNode from '../dexNodes/DexNode';
import type { TBuildTransactionsOptionsModified } from '../types';
import type { TPreparedExtrinsics } from '../types';
import { createSwapTx } from './createSwapTx';
import { buildFromExchangeExtrinsic, buildToExchangeExtrinsic } from './utils';

export const prepareExtrinsics = async (
  dex: ExchangeNode,
  options: TBuildTransactionsOptionsModified,
): Promise<TPreparedExtrinsics> => {
  const {
    origin,
    exchange,
    destination,
    currencyTo,
    amount,
    evmSenderAddress,
    senderAddress,
    recipientAddress,
  } = options;

  if ((origin || destination) && (dex.node.includes('AssetHub') || dex.node === 'Hydration')) {
    try {
      const amountOut = await dex.getAmountOut(exchange.api, {
        ...options,
        papiApi: exchange.apiPapi,
        assetFrom: exchange.assetFrom,
        assetTo: exchange.assetTo,
      });

      const tx = await handleSwapExecuteTransfer({
        chain: origin?.node,
        exchangeChain: exchange.baseNode,
        destChain: destination?.node,
        assetInfoFrom: {
          ...(origin?.assetFrom ?? exchange.assetFrom),
          amount: BigInt(amount),
        } as WithAmount<TAssetInfo>,
        assetInfoTo: { ...exchange.assetTo, amount: amountOut } as WithAmount<TAssetInfo>,
        senderAddress: evmSenderAddress ?? senderAddress,
        currencyTo,
        recipientAddress: recipientAddress ?? senderAddress,
        calculateMinAmountOut: (amountIn: bigint, assetTo?: TAssetInfo) =>
          dex.getAmountOut(exchange.api, {
            ...options,
            amount: amountIn.toString(),
            papiApi: options.exchange.apiPapi,
            assetFrom: options.exchange.assetFrom,
            assetTo: assetTo ?? options.exchange.assetTo,
          }),
      });

      return { swapTxs: [tx], isExecute: true, amountOut };
    } catch (error) {
      // If the execute is not supported, fallback to default swap execution
      if (
        !(
          error instanceof DryRunFailedError &&
          error.dryRunType === 'origin' &&
          error.reason === 'Filtered'
        )
      ) {
        throw error;
      }
    }
  }

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
