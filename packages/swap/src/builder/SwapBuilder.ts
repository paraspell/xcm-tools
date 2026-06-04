import type {
  PolkadotApi,
  TAmount,
  TChain,
  TCurrencyInput,
  TDryRunPreviewOptions,
  TDryRunResult,
  TExchangeChain,
  TExchangeInput,
  TGetXcmFeeBuilderOptions,
  TGetXcmFeeResult,
  TStatusChangeCallback,
  TSubstrateChain,
  TSwapBuilder,
  TTransactionContext,
  TTransferInfo,
  TXcmFeeDetailWithForwardedXcm,
} from '@paraspell/sdk-core';
import { normalizeExchange } from '@paraspell/sdk-core';

import {
  buildApiTransactions,
  dryRunRouter,
  dryRunRouterPreview,
  getBestAmountOut,
  getMinTransferableAmount,
  getOriginXcmFee,
  getSwapInfo,
  getTransferableAmount,
  getXcmFees,
  transfer,
} from '../transfer';
import type {
  TBuildTransactionsBaseOptions,
  TGetBestAmountOutBaseOptions,
  TTransferBaseOptions,
} from '../types';

export class SwapBuilderCore<
  TApi,
  TRes,
  TSigner,
  T extends Partial<TTransferBaseOptions<TApi, TRes, TSigner>> = object,
  TCustomChain extends string = never,
> {
  readonly _api: PolkadotApi<TApi, TRes, TSigner, TCustomChain>;
  readonly _options: T;

  constructor(api: PolkadotApi<TApi, TRes, TSigner, TCustomChain>, options?: T) {
    this._api = api;
    this._options = options ?? ({} as T);
  }

  from(
    chain: TSubstrateChain | undefined,
  ): SwapBuilderCore<TApi, TRes, TSigner, T & { from: TSubstrateChain | undefined }, TCustomChain> {
    return new SwapBuilderCore(this._api, { ...this._options, from: chain });
  }

  exchange(
    chain: TExchangeInput,
  ): SwapBuilderCore<TApi, TRes, TSigner, T & { exchange: TExchangeInput }, TCustomChain> {
    return new SwapBuilderCore(this._api, { ...this._options, exchange: normalizeExchange(chain) });
  }

  to(
    chain: TChain | undefined,
  ): SwapBuilderCore<TApi, TRes, TSigner, T & { to: TChain | undefined }, TCustomChain> {
    return new SwapBuilderCore(this._api, { ...this._options, to: chain });
  }

  currencyFrom(
    currency: TCurrencyInput,
  ): SwapBuilderCore<TApi, TRes, TSigner, T & { currencyFrom: TCurrencyInput }, TCustomChain> {
    return new SwapBuilderCore(this._api, { ...this._options, currencyFrom: currency });
  }

  currencyTo(
    currency: TCurrencyInput,
  ): SwapBuilderCore<TApi, TRes, TSigner, T & { currencyTo: TCurrencyInput }, TCustomChain> {
    return new SwapBuilderCore(this._api, { ...this._options, currencyTo: currency });
  }

  feeAsset(
    currency: TCurrencyInput | undefined,
  ): SwapBuilderCore<
    TApi,
    TRes,
    TSigner,
    T & { feeAsset: TCurrencyInput | undefined },
    TCustomChain
  > {
    return new SwapBuilderCore(this._api, { ...this._options, feeAsset: currency });
  }

  amount(
    amount: TAmount,
  ): SwapBuilderCore<TApi, TRes, TSigner, T & { amount: TAmount }, TCustomChain> {
    return new SwapBuilderCore(this._api, { ...this._options, amount: amount.toString() });
  }

  recipient(
    address: string | undefined,
  ): SwapBuilderCore<TApi, TRes, TSigner, T & { recipient: string | undefined }, TCustomChain> {
    return new SwapBuilderCore(this._api, { ...this._options, recipient: address });
  }

  sender(
    address: string,
  ): SwapBuilderCore<TApi, TRes, TSigner, T & { sender: string }, TCustomChain> {
    return new SwapBuilderCore(this._api, { ...this._options, sender: address });
  }

  signer(
    signer: TSigner,
  ): SwapBuilderCore<TApi, TRes, TSigner, T & { signer: TSigner }, TCustomChain> {
    return new SwapBuilderCore(this._api, { ...this._options, signer });
  }

  evmSenderAddress(
    address: string | undefined,
  ): SwapBuilderCore<
    TApi,
    TRes,
    TSigner,
    T & { evmSenderAddress: string | undefined },
    TCustomChain
  > {
    return new SwapBuilderCore(this._api, { ...this._options, evmSenderAddress: address });
  }

  evmSigner(
    signer: TSigner | undefined,
  ): SwapBuilderCore<TApi, TRes, TSigner, T & { evmSigner: TSigner | undefined }, TCustomChain> {
    return new SwapBuilderCore(this._api, { ...this._options, evmSigner: signer });
  }

  slippagePct(
    pct: string,
  ): SwapBuilderCore<TApi, TRes, TSigner, T & { slippagePct: string }, TCustomChain> {
    return new SwapBuilderCore(this._api, { ...this._options, slippagePct: pct });
  }

  onStatusChange(
    callback: TStatusChangeCallback<TApi, TRes>,
  ): SwapBuilderCore<
    TApi,
    TRes,
    TSigner,
    T & { onStatusChange: TStatusChangeCallback<TApi, TRes> },
    TCustomChain
  > {
    return new SwapBuilderCore(this._api, { ...this._options, onStatusChange: callback });
  }

  async getXcmFees<TDisableFallback extends boolean = false>(
    this: SwapBuilderCore<
      TApi,
      TRes,
      TSigner,
      TBuildTransactionsBaseOptions<TApi, TRes, TSigner>,
      TCustomChain
    >,
    options?: TGetXcmFeeBuilderOptions & { disableFallback: TDisableFallback },
  ): Promise<TGetXcmFeeResult<TDisableFallback>> {
    const disableFallback = (options?.disableFallback ?? false) as TDisableFallback;
    return getXcmFees({ ...this._options, api: this._api }, disableFallback);
  }

  async getOriginXcmFee<TDisableFallback extends boolean = false>(
    this: SwapBuilderCore<
      TApi,
      TRes,
      TSigner,
      TBuildTransactionsBaseOptions<TApi, TRes, TSigner>,
      TCustomChain
    >,
    options?: TGetXcmFeeBuilderOptions & { disableFallback: TDisableFallback },
  ): Promise<TXcmFeeDetailWithForwardedXcm<TDisableFallback>> {
    const disableFallback = (options?.disableFallback ?? false) as TDisableFallback;
    return getOriginXcmFee({ ...this._options, api: this._api }, disableFallback);
  }

  async getSwapInfo(
    this: SwapBuilderCore<
      TApi,
      TRes,
      TSigner,
      TBuildTransactionsBaseOptions<TApi, TRes, TSigner>,
      TCustomChain
    >,
  ): Promise<TTransferInfo> {
    return getSwapInfo({ ...this._options, api: this._api });
  }

  async getTransferableAmount(
    this: SwapBuilderCore<
      TApi,
      TRes,
      TSigner,
      TBuildTransactionsBaseOptions<TApi, TRes, TSigner>,
      TCustomChain
    >,
  ): Promise<bigint> {
    return getTransferableAmount({ ...this._options, api: this._api });
  }

  async getMinTransferableAmount(
    this: SwapBuilderCore<
      TApi,
      TRes,
      TSigner,
      TBuildTransactionsBaseOptions<TApi, TRes, TSigner>,
      TCustomChain
    >,
  ): Promise<bigint> {
    return getMinTransferableAmount({ ...this._options, api: this._api });
  }

  signAndSubmit(
    this: SwapBuilderCore<
      TApi,
      TRes,
      TSigner,
      TTransferBaseOptions<TApi, TRes, TSigner>,
      TCustomChain
    >,
  ): Promise<string[]> {
    return transfer({ ...this._options, api: this._api });
  }

  build(
    this: SwapBuilderCore<
      TApi,
      TRes,
      TSigner,
      TBuildTransactionsBaseOptions<TApi, TRes, TSigner>,
      TCustomChain
    >,
  ): Promise<TTransactionContext<TApi, TRes>[]> {
    return buildApiTransactions({ ...this._options, api: this._api });
  }

  dryRun(
    this: SwapBuilderCore<
      TApi,
      TRes,
      TSigner,
      TBuildTransactionsBaseOptions<TApi, TRes, TSigner>,
      TCustomChain
    >,
  ): Promise<TDryRunResult> {
    return dryRunRouter({ ...this._options, api: this._api });
  }

  dryRunPreview(
    this: SwapBuilderCore<
      TApi,
      TRes,
      TSigner,
      TBuildTransactionsBaseOptions<TApi, TRes, TSigner>,
      TCustomChain
    >,
    previewOptions?: TDryRunPreviewOptions,
  ): Promise<TDryRunResult> {
    return dryRunRouterPreview({ ...this._options, api: this._api }, previewOptions);
  }

  getBestAmountOut(
    this: SwapBuilderCore<
      TApi,
      TRes,
      TSigner,
      TGetBestAmountOutBaseOptions<TApi, TRes, TSigner>,
      TCustomChain
    >,
  ): Promise<{ exchange: TExchangeChain; amountOut: bigint }> {
    return getBestAmountOut({ ...this._options, api: this._api });
  }
}

export const SwapBuilder = <TApi, TRes, TSigner, TCustomChain extends string = never>(
  api: PolkadotApi<TApi, TRes, TSigner, TCustomChain>,
): TSwapBuilder<TApi, TRes, TSigner> => new SwapBuilderCore(api);
