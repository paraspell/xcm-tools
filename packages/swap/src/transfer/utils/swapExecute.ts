import type {
  TAssetInfo,
  TGetXcmFeeResult,
  TXcmFeeDetailWithForwardedXcm,
} from '@paraspell/sdk-core';
import {
  applyDecimalAbstraction,
  assertCurrencyCore,
  DryRunFailedError,
  getOriginXcmFee,
  getXcmFee,
  handleSwapExecuteTransfer,
  RoutingResolutionError,
} from '@paraspell/sdk-core';

import type ExchangeChain from '../../exchanges/ExchangeChain';
import type {
  TBuildSwapExecuteOverrides,
  TCallDexAmountOutOverrides,
  TSwapTransformedOptions,
} from '../../types';
import { pickExchangeApiVariant } from './buildExchangeApiVariant';

export const callDexAmountOut = <TApi, TRes, TSigner, TCustomChain extends string = never>(
  dex: ExchangeChain,
  options: TSwapTransformedOptions<TApi, TRes, TSigner, TCustomChain>,
  overrides: TCallDexAmountOutOverrides = {},
) =>
  dex.getAmountOut({
    ...options,
    ...pickExchangeApiVariant(options.exchange),
    amount: overrides.amount ?? options.amount,
    api: options.exchange.api,
    assetFrom: options.exchange.assetFrom,
    assetTo: overrides.assetTo ?? options.exchange.assetTo,
    ...(overrides.slippagePct !== undefined && { slippagePct: overrides.slippagePct }),
  });

export const buildSwapExecuteTx = async <TApi, TRes, TSigner, TCustomChain extends string = never>(
  dex: ExchangeChain,
  options: TSwapTransformedOptions<TApi, TRes, TSigner, TCustomChain>,
  overrides: TBuildSwapExecuteOverrides = {},
): Promise<{ tx: TRes; amountOut: bigint }> => {
  const {
    api,
    origin,
    exchange,
    destination,
    currencyTo,
    amount,
    sender,
    recipient,
    evmSenderAddress,
  } = options;

  const amt = overrides.amount ?? amount;
  const minAmountOutSlippage = overrides.feeEstimation ? '1' : undefined;

  const amountOut = await callDexAmountOut(dex, options, { amount: amt });

  const tx = await handleSwapExecuteTransfer({
    api,
    chain: origin?.chain,
    exchangeChain: exchange.chain,
    destChain: destination?.chain,
    assetInfoFrom: { ...(origin?.assetFrom ?? exchange.assetFrom), amount: amt },
    assetInfoTo: { ...exchange.assetTo, amount: amountOut },
    currencyTo,
    feeAssetInfo: origin?.feeAssetInfo ?? exchange.feeAssetInfo,
    sender: evmSenderAddress ?? sender,
    recipient: recipient ?? sender,
    calculateMinAmountOut: (amountIn: bigint, assetTo?: TAssetInfo) =>
      callDexAmountOut(dex, options, {
        amount: amountIn,
        assetTo,
        slippagePct: minAmountOutSlippage,
      }),
  });

  return { tx, amountOut };
};

export const createSwapExecuteBuildTx =
  <TApi, TRes, TSigner, TCustomChain extends string = never>(
    dex: ExchangeChain,
    options: TSwapTransformedOptions<TApi, TRes, TSigner, TCustomChain>,
  ) =>
  async (overrideAmount?: string) => {
    const amt =
      overrideAmount !== undefined
        ? applyDecimalAbstraction(overrideAmount, options.exchange.assetFrom.decimals, true)
        : options.amount;
    const { tx } = await buildSwapExecuteTx(dex, options, { amount: amt, feeEstimation: true });
    return tx;
  };

export const canUseExecuteTransfer = <TApi, TRes, TSigner, TCustomChain extends string = never>(
  dex: ExchangeChain,
  options: TSwapTransformedOptions<TApi, TRes, TSigner, TCustomChain>,
): boolean =>
  Boolean(options.origin || options.destination) &&
  (dex.chain.includes('AssetHub') || dex.chain === 'Hydration');

export const isFilteredError = (error: unknown): boolean =>
  error instanceof DryRunFailedError &&
  error.dryRunType === 'origin' &&
  error.reason === 'Filtered';

export const getSwapExecuteXcmFee = async <
  TApi,
  TRes,
  TSigner,
  TDisableFallback extends boolean,
  TCustomChain extends string = never,
>(
  dex: ExchangeChain,
  options: TSwapTransformedOptions<TApi, TRes, TSigner, TCustomChain>,
  disableFallback: TDisableFallback,
): Promise<{ result: TGetXcmFeeResult<TDisableFallback>; amountOut: bigint }> => {
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

  assertCurrencyCore(currencyTo);

  const buildTx = createSwapExecuteBuildTx(dex, options);
  const amountOut = await callDexAmountOut(dex, options);

  const result = await getXcmFee({
    api,
    buildTx,
    origin: origin?.chain ?? exchange.chain,
    destination: destination?.chain ?? exchange.chain,
    sender: evmSenderAddress ?? sender,
    recipient: recipient ?? sender,
    currency: { ...currencyFrom, amount: amount },
    feeAsset,
    disableFallback,
    swapConfig: {
      currencyTo,
      exchangeChain: exchange.chain,
      amountOut,
    },
  });

  if (result.failureReason === 'NoDeal' && exchange.chain === 'Hydration') {
    throw new RoutingResolutionError(
      'An error occured, either this route is not registered for swap on exchange chain, or the amount out was not able to be calculated.',
    );
  }

  return { result, amountOut };
};

export const getSwapExecuteOriginXcmFee = async <
  TApi,
  TRes,
  TSigner,
  TDisableFallback extends boolean,
  TCustomChain extends string = never,
>(
  dex: ExchangeChain,
  options: TSwapTransformedOptions<TApi, TRes, TSigner, TCustomChain>,
  disableFallback: TDisableFallback,
): Promise<TXcmFeeDetailWithForwardedXcm<TDisableFallback>> => {
  const {
    api,
    origin,
    exchange,
    currencyFrom,
    feeAsset,
    destination,
    amount,
    sender,
    evmSenderAddress,
  } = options;

  const buildTx = createSwapExecuteBuildTx(dex, options);

  assertCurrencyCore(currencyFrom);

  return getOriginXcmFee({
    api,
    buildTx,
    origin: origin?.chain ?? exchange.chain,
    destination: destination?.chain ?? exchange.chain,
    sender: evmSenderAddress ?? sender,
    currency: { ...currencyFrom, amount },
    feeAsset,
    disableFallback,
  });
};
