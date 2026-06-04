import type { TGetXcmFeeResult } from '@paraspell/sdk-core';

import type ExchangeChain from '../exchanges/ExchangeChain';
import type { TBuildTransactionsOptions, TTransformedOptions } from '../types';
import { getSwapFee } from './fees';
import {
  canUseExecuteTransfer,
  getFromExchangeFee,
  getSwapExecuteXcmFee,
  getToExchangeFee,
  isFilteredError,
} from './utils';

export const getRouterFees = async <
  TApi,
  TRes,
  TSigner,
  TDisableFallback extends boolean,
  TCustomChain extends string = never,
>(
  dex: ExchangeChain,
  options: TTransformedOptions<
    TBuildTransactionsOptions<TApi, TRes, TSigner, TCustomChain>,
    TApi,
    TRes,
    TSigner,
    TCustomChain
  >,
  disableFallback: TDisableFallback,
): Promise<TGetXcmFeeResult> => {
  const { api, origin, exchange, destination, sender } = options;

  if (canUseExecuteTransfer(dex, options)) {
    try {
      const { result } = await getSwapExecuteXcmFee(dex, options, disableFallback);

      const transformedHops = result.hops.map((hop) =>
        hop.chain === exchange.chain
          ? { chain: hop.chain, result: { ...hop.result, isExchange: true } }
          : hop,
      );

      return {
        ...result,
        origin: { ...result.origin, ...(!origin && { isExchange: true }) },
        destination: { ...result.destination, ...(!destination && { isExchange: true }) },
        hops: transformedHops,
      };
    } catch (error) {
      if (!isFilteredError(error)) throw error;
      // Fall through to three-leg path
    }
  }

  // 1. Get fees for origin -> exchange (optional)
  const sendingChain =
    origin && origin.chain !== exchange.chain
      ? await getToExchangeFee({ ...options, origin }, disableFallback)
      : undefined;

  // 2. Get fees for swap in DEX (always)
  const { result: swapChain, amountOut } = await getSwapFee(dex, options);

  // 3. Get fees for exchange -> destination (optional)
  const receivingChain =
    destination && destination.chain !== exchange.chain
      ? await getFromExchangeFee(
          { exchange, destination, amount: amountOut, sender, api },
          disableFallback,
        )
      : undefined;

  const mergedHops = [
    // Hops from sending chain (origin -> exchange)
    ...(sendingChain?.hops ?? []),

    // Add the swap operation as a hop on the exchange chain
    ...(sendingChain && receivingChain
      ? [
          {
            chain: exchange.chain,
            result: {
              ...swapChain,
              fee: swapChain.fee + (receivingChain?.origin.fee ?? 0n),
              isExchange: true,
            },
          },
        ]
      : []),

    // Hops from receiving chain (exchange -> destination)
    ...(receivingChain?.hops ?? []),
  ];

  const finalOrigin = sendingChain?.origin ?? {
    ...swapChain,
    ...(!origin && { isExchange: true }),
  };

  const finalDestination = receivingChain?.destination ?? {
    ...swapChain,
    ...(!destination && { isExchange: true }),
    ...(!origin && !destination && { fee: 0n }),
  };

  return {
    failureReason: sendingChain?.failureReason ?? receivingChain?.failureReason,
    failureChain: sendingChain?.failureChain ?? receivingChain?.failureChain,
    origin: finalOrigin,
    destination: finalDestination,
    hops: mergedHops,
  };
};
