import type { TAssetInfo, WithAmount } from '@paraspell/sdk';
import { DryRunFailedError, handleSwapExecuteTransfer } from '@paraspell/sdk';

import type ExchangeChain from '../exchanges/ExchangeChain';
import type { TBuildTransactionsOptions, TPreparedExtrinsics, TTransformedOptions } from '../types';
import { createSwapTx } from './createSwapTx';
import { buildFromExchangeExtrinsic, buildToExchangeExtrinsic } from './utils';

export const prepareExtrinsics = async (
  dex: ExchangeChain,
  options: TTransformedOptions<TBuildTransactionsOptions>,
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
    builderOptions,
  } = options;

  if ((origin || destination) && dex.chain.includes('AssetHub')) {
    try {
      const amountOut = await dex.getAmountOut(exchange.api, {
        ...options,
        papiApi: exchange.apiPapi,
        assetFrom: exchange.assetFrom,
        assetTo: exchange.assetTo,
      });

      const tx = await handleSwapExecuteTransfer(
        {
          chain: origin?.chain,
          exchangeChain: exchange.baseChain,
          destChain: destination?.chain,
          assetInfoFrom: {
            ...(origin?.assetFrom ?? exchange.assetFrom),
            amount: BigInt(amount),
          } as WithAmount<TAssetInfo>,
          assetInfoTo: { ...exchange.assetTo, amount: amountOut } as WithAmount<TAssetInfo>,
          senderAddress: evmSenderAddress ?? senderAddress,
          currencyTo,
          feeAssetInfo: origin?.feeAssetInfo ?? exchange.feeAssetInfo,
          recipientAddress: recipientAddress ?? senderAddress,
          calculateMinAmountOut: (amountIn: bigint, assetTo?: TAssetInfo) =>
            dex.getAmountOut(exchange.api, {
              ...options,
              amount: amountIn,
              papiApi: options.exchange.apiPapi,
              assetFrom: options.exchange.assetFrom,
              assetTo: assetTo ?? options.exchange.assetTo,
            }),
        },
        builderOptions,
      );

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
          senderAddress,
          builderOptions,
        })
      : undefined;

  return { toExchangeTx, swapTxs, toDestTx, amountOut: BigInt(amountOut) };
};
