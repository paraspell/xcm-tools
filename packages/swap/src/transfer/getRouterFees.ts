import type { TAssetInfo, TCurrencyCore, TGetXcmFeeResult, WithAmount } from '@paraspell/sdk-core';
import {
  applyDecimalAbstraction,
  DryRunFailedError,
  getXcmFee,
  handleSwapExecuteTransfer,
  RoutingResolutionError,
} from '@paraspell/sdk-core';

import type ExchangeChain from '../exchanges/ExchangeChain';
import type { TBuildTransactionsOptions, TTransformedOptions } from '../types';
import { getSwapFee } from './fees';
import { getFromExchangeFee, getToExchangeFee } from './utils';

export const getRouterFees = async <TApi, TRes, TSigner, TDisableFallback extends boolean>(
  dex: ExchangeChain,
  options: TTransformedOptions<TBuildTransactionsOptions<TApi, TRes, TSigner>, TApi, TRes, TSigner>,
  disableFallback: TDisableFallback,
): Promise<TGetXcmFeeResult> => {
  const {
    api,
    origin,
    exchange,
    currencyFrom,
    currencyTo,
    feeAsset,
    destination,
    amount,
    sender,
    recipient,
    evmSenderAddress,
  } = options;

  if ((origin || destination) && (dex.chain.includes('AssetHub') || dex.chain === 'Hydration')) {
    try {
      const buildTx = async (overrideAmount?: string) => {
        const amt =
          overrideAmount !== undefined
            ? applyDecimalAbstraction(overrideAmount, exchange.assetFrom.decimals, true)
            : amount;
        const amountOut = await dex.getAmountOut({
          ...options,
          amount: amt,
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
            amount: BigInt(amt),
          },
          assetInfoTo: { ...exchange.assetTo, amount: amountOut },
          currencyTo,
          feeAssetInfo: origin?.feeAssetInfo ?? exchange.feeAssetInfo,
          sender: evmSenderAddress ?? sender,
          recipient: recipient ?? sender,
          calculateMinAmountOut: (amountIn: bigint, assetTo?: TAssetInfo) =>
            dex.getAmountOut({
              ...options,
              amount: amountIn,
              apiPjs: options.exchange.apiPjs,
              api: options.exchange.api,
              assetFrom: options.exchange.assetFrom,
              assetTo: assetTo ?? options.exchange.assetTo,
              slippagePct: '1',
            }),
        });

        return tx;
      };

      const mainAmountOut = await dex.getAmountOut({
        ...options,
        amount,
        api: exchange.api,
        apiPjs: exchange.apiPjs,
        assetFrom: exchange.assetFrom,
        assetTo: exchange.assetTo,
      });

      const executeResult = await getXcmFee({
        api,
        buildTx,
        origin: origin?.chain ?? exchange.chain,
        destination: destination?.chain ?? exchange.chain,
        sender: evmSenderAddress ?? sender,
        recipient: recipient ?? sender,
        currency: { ...currencyFrom, amount: BigInt(amount) } as WithAmount<TCurrencyCore>,
        feeAsset,
        disableFallback,
        swapConfig: {
          currencyTo: currencyTo as TCurrencyCore,
          exchangeChain: exchange.chain,
          amountOut: mainAmountOut,
        },
      });

      if (executeResult.failureReason === 'NoDeal' && exchange.chain === 'Hydration') {
        throw new RoutingResolutionError(
          'An error occured, either this route is not registered for swap on exchange chain, or the amount out was not able to be calculated.',
        );
      }

      const transformedHops = executeResult.hops.map((hop) => {
        if (hop.chain === exchange.chain) {
          return {
            chain: hop.chain,
            result: {
              ...hop.result,
              isExchange: true,
            },
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
    origin && origin.chain !== exchange.chain
      ? await getToExchangeFee({ ...options, origin }, disableFallback)
      : undefined;

  // 2. Get fees for swap in DEX (always)
  const { result: swapChain, amountOut } = await getSwapFee(dex, options);

  // 3. Get fees for exchange -> destination (optional)
  const receivingChain =
    destination && destination.chain !== exchange.chain
      ? await getFromExchangeFee(
          {
            exchange,
            destination,
            amount: amountOut,
            sender,
            api,
          },
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
              fee: (swapChain.fee as bigint) + (receivingChain?.origin.fee ?? 0n),
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
