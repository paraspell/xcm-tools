import type { TAssetInfo, WithAmount } from '@paraspell/sdk-core';
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
      const amountOut = await dex.getAmountOut(exchange.apiPjs, {
        ...options,
        papiApi: exchange.apiPapi,
        assetFrom: exchange.assetFrom,
        assetTo: exchange.assetTo,
      });

      const tx = await handleSwapExecuteTransfer({
        api,
        chain: origin?.chain,
        exchangeChain: exchange.baseChain,
        destChain: destination?.chain,
        assetInfoFrom: {
          ...(origin?.assetFrom ?? exchange.assetFrom),
          amount: BigInt(amount),
        } as WithAmount<TAssetInfo>,
        assetInfoTo: { ...exchange.assetTo, amount: amountOut } as WithAmount<TAssetInfo>,
        sender: evmSenderAddress ?? sender,
        recipient: recipient ?? sender,
        currencyTo,
        feeAssetInfo: origin?.feeAssetInfo ?? exchange.feeAssetInfo,
        calculateMinAmountOut: (amountIn: bigint, assetTo?: TAssetInfo) =>
          dex.getAmountOut(exchange.apiPjs, {
            ...options,
            amount: amountIn,
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
    origin && origin.chain !== exchange.baseChain
      ? await buildToExchangeExtrinsic({ ...options, origin })
      : undefined;

  // 2. Create swap in DEX (always)
  const { txs: swapTxs, amountOut } = await createSwapTx(dex, options);

  // 3. Create transfer exchange -> destination (optional)
  const toDestTx =
    destination && destination.chain !== exchange.baseChain
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
