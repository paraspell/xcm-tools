import type { TAssetInfo, TCurrencyCore, WithAmount } from '@paraspell/sdk';
import { DryRunFailedError, getXcmFee, handleSwapExecuteTransfer } from '@paraspell/sdk';

import type ExchangeChain from '../exchanges/ExchangeChain';
import type { TBuildTransactionsOptionsModified, TRouterXcmFeeResult } from '../types';
import { getSwapFee } from './fees';
import { getFromExchangeFee, getToExchangeFee } from './utils';

export const getRouterFees = async (
  dex: ExchangeChain,
  options: TBuildTransactionsOptionsModified,
): Promise<TRouterXcmFeeResult> => {
  const {
    origin,
    exchange,
    currencyFrom,
    currencyTo,
    destination,
    amount,
    recipientAddress,
    evmSenderAddress,
    senderAddress,
  } = options;

  if ((origin || destination) && (dex.chain.includes('AssetHub') || dex.chain === 'Hydration')) {
    try {
      const amountOut = await dex.getAmountOut(exchange.api, {
        ...options,
        papiApi: exchange.apiPapi,
        assetFrom: exchange.assetFrom,
        assetTo: exchange.assetTo,
      });

      const tx = await handleSwapExecuteTransfer({
        chain: origin?.chain,
        exchangeChain: exchange.baseChain,
        destChain: destination?.chain,
        assetInfoFrom: {
          ...(origin?.assetFrom ?? exchange.assetFrom),
          amount: BigInt(amount),
        } as WithAmount<TAssetInfo>,
        assetInfoTo: { ...exchange.assetTo, amount: amountOut } as WithAmount<TAssetInfo>,
        currencyTo,
        senderAddress: evmSenderAddress ?? senderAddress,
        recipientAddress: recipientAddress ?? senderAddress,
        calculateMinAmountOut: (amountIn: bigint, assetTo?: TAssetInfo) =>
          dex.getAmountOut(exchange.api, {
            ...options,
            amount: amountIn.toString(),
            papiApi: options.exchange.apiPapi,
            assetFrom: options.exchange.assetFrom,
            assetTo: assetTo ?? options.exchange.assetTo,
            slippagePct: '1',
          }),
      });

      const executeResult = await getXcmFee({
        tx,
        origin: origin?.chain ?? exchange.baseChain,
        destination: destination?.chain ?? exchange.baseChain,
        senderAddress: evmSenderAddress ?? senderAddress,
        address: recipientAddress ?? senderAddress,
        currency: { ...currencyFrom, amount: BigInt(amount) } as WithAmount<TCurrencyCore>,
        disableFallback: false,
        swapConfig: {
          currencyTo: currencyTo as TCurrencyCore,
          exchangeChain: exchange.baseChain,
        },
      });

      const transformedHops = executeResult.hops.map((hop) => {
        if (hop.chain === exchange.baseChain) {
          return {
            ...hop,
            isExchange: true,
          };
        }
        return hop;
      });

      return {
        ...executeResult,
        origin: {
          ...executeResult.origin,
          ...(!origin && { isExchange: true }),
        },
        destination: {
          ...executeResult.destination,
          ...(!destination && { isExchange: true }),
        },
        hops: transformedHops,
      };
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

  // 1. Get fees for origin -> exchange (optional)
  const sendingChain =
    origin && origin.chain !== exchange.baseChain
      ? await getToExchangeFee({ ...options, origin })
      : undefined;

  // 2. Get fees for swap in DEX (always)
  const { result: swapChain, amountOut } = await getSwapFee(dex, options);

  // 3. Get fees for exchange -> destination (optional)
  const receivingChain =
    destination && destination.chain !== exchange.baseChain
      ? await getFromExchangeFee({
          exchange,
          destination,
          amount: amountOut,
          senderAddress,
        })
      : undefined;

  const mergedHops = [
    // Hops from sending chain (origin -> exchange)
    ...(sendingChain?.hops ?? []),

    // Add the swap operation as a hop on the exchange chain
    ...(sendingChain && receivingChain
      ? [
          {
            chain: exchange.baseChain,
            result: {
              ...swapChain,
              fee: (swapChain.fee as bigint) + (receivingChain?.origin.fee ?? 0n),
            },
            isExchange: true,
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
