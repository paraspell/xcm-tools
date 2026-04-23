import type { TAssetInfo } from '@paraspell/sdk-core';
import { DryRunFailedError, handleSwapExecuteTransfer } from '@paraspell/sdk-core';

import type ExchangeChain from '../exchanges/ExchangeChain';
import type { TBuildTransactionsOptions, TPreparedExtrinsics, TTransformedOptions } from '../types';
import { createSwapTx } from './createSwapTx';
import { buildFromExchangeExtrinsic, buildToExchangeExtrinsic } from './utils';

export const prepareExtrinsics = async <TApi, TRes, TSigner>(
  dex: ExchangeChain,
  options: TTransformedOptions<TBuildTransactionsOptions<TApi, TRes, TSigner>, TApi, TRes, TSigner>,
): Promise<TPreparedExtrinsics<TRes>> => {
  const {
    api,
    origin,
    exchange,
    destination,
    currencyTo,
    amount,
    evmSenderAddress,
    sender,
    recipient,
  } = options;

  if ((origin || destination) && (dex.chain.includes('AssetHub') || dex.chain === 'Hydration')) {
    try {
      const amountOut = await dex.getAmountOut({
        ...options,
        api: exchange.api,
        apiPjs: exchange.apiPjs,
        assetFrom: exchange.assetFrom,
        assetTo: exchange.assetTo,
      });

      const tx = await handleSwapExecuteTransfer({
        api,
        chain: origin?.chain,
        exchangeChain: exchange.chain,
        destChain: destination?.chain,
        assetInfoFrom: {
          ...(origin?.assetFrom ?? exchange.assetFrom),
          amount: BigInt(amount),
        },
        assetInfoTo: { ...exchange.assetTo, amount: amountOut },
        sender: evmSenderAddress ?? sender,
        recipient: recipient ?? sender,
        currencyTo,
        feeAssetInfo: origin?.feeAssetInfo ?? exchange.feeAssetInfo,
        calculateMinAmountOut: (amountIn: bigint, assetTo?: TAssetInfo) =>
          dex.getAmountOut({
            ...options,
            amount: amountIn,
            api: options.exchange.api,
            apiPjs: options.exchange.apiPjs,
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
    origin && origin.chain !== exchange.chain
      ? await buildToExchangeExtrinsic({ ...options, origin })
      : undefined;

  // 2. Create swap in DEX (always)
  const { txs: swapTxs, amountOut } = await createSwapTx(dex, options);

  // 3. Create transfer exchange -> destination (optional)
  const toDestTx =
    destination && destination.chain !== exchange.chain
      ? await buildFromExchangeExtrinsic({
          exchange,
          destination,
          amount: amountOut,
          sender,
          api,
        })
      : undefined;

  return { toExchangeTx, swapTxs, toDestTx, amountOut: BigInt(amountOut) };
};
