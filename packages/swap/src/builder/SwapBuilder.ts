import type {
  PolkadotApi,
  TAmount,
  TChain,
  TCurrencyInput,
  TDryRunResult,
  TExchangeChain,
  TExchangeInput,
  TGetXcmFeeBuilderOptions,
  TGetXcmFeeResult,
  TStatusChangeCallback,
  TSubstrateChain,
  TSwapBuilder,
  TTransactionContext,
} from '@paraspell/sdk-core';
import { normalizeExchange } from '@paraspell/sdk-core';

import {
  buildApiTransactions,
  dryRunRouter,
  getBestAmountOut,
  getMinTransferableAmount,
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
> {
  readonly _api: PolkadotApi<TApi, TRes, TSigner>;
  readonly _options: T;

  constructor(api: PolkadotApi<TApi, TRes, TSigner>, options?: T) {
    this._api = api;
    this._options = options ?? ({} as T);
  }

  from(
    chain: TSubstrateChain | undefined,
  ): SwapBuilderCore<TApi, TRes, TSigner, T & { from: TSubstrateChain | undefined }> {
    return new SwapBuilderCore(this._api, { ...this._options, from: chain });
  }

  exchange(
    chain: TExchangeInput,
  ): SwapBuilderCore<TApi, TRes, TSigner, T & { exchange: TExchangeInput }> {
    return new SwapBuilderCore(this._api, { ...this._options, exchange: normalizeExchange(chain) });
  }

  to(
    chain: TChain | undefined,
  ): SwapBuilderCore<TApi, TRes, TSigner, T & { to: TChain | undefined }> {
    return new SwapBuilderCore(this._api, { ...this._options, to: chain });
  }

  currencyFrom(
    currency: TCurrencyInput,
  ): SwapBuilderCore<TApi, TRes, TSigner, T & { currencyFrom: TCurrencyInput }> {
    return new SwapBuilderCore(this._api, { ...this._options, currencyFrom: currency });
  }

  currencyTo(
    currency: TCurrencyInput,
  ): SwapBuilderCore<TApi, TRes, TSigner, T & { currencyTo: TCurrencyInput }> {
    return new SwapBuilderCore(this._api, { ...this._options, currencyTo: currency });
  }

  feeAsset(
    currency: TCurrencyInput | undefined,
  ): SwapBuilderCore<TApi, TRes, TSigner, T & { feeAsset: TCurrencyInput | undefined }> {
    return new SwapBuilderCore(this._api, { ...this._options, feeAsset: currency });
  }

  amount(amount: TAmount): SwapBuilderCore<TApi, TRes, TSigner, T & { amount: TAmount }> {
    return new SwapBuilderCore(this._api, { ...this._options, amount: amount.toString() });
  }

  recipient(
    address: string | undefined,
  ): SwapBuilderCore<TApi, TRes, TSigner, T & { recipient: string | undefined }> {
    return new SwapBuilderCore(this._api, { ...this._options, recipient: address });
  }

  sender(address: string): SwapBuilderCore<TApi, TRes, TSigner, T & { sender: string }> {
    return new SwapBuilderCore(this._api, { ...this._options, sender: address });
  }

  signer(signer: TSigner): SwapBuilderCore<TApi, TRes, TSigner, T & { signer: TSigner }> {
    return new SwapBuilderCore(this._api, { ...this._options, signer });
  }

  evmSenderAddress(
    address: string | undefined,
  ): SwapBuilderCore<TApi, TRes, TSigner, T & { evmSenderAddress: string | undefined }> {
    return new SwapBuilderCore(this._api, { ...this._options, evmSenderAddress: address });
  }

  evmSigner(
    signer: TSigner | undefined,
  ): SwapBuilderCore<TApi, TRes, TSigner, T & { evmSigner: TSigner | undefined }> {
    return new SwapBuilderCore(this._api, { ...this._options, evmSigner: signer });
  }

  slippagePct(pct: string): SwapBuilderCore<TApi, TRes, TSigner, T & { slippagePct: string }> {
    return new SwapBuilderCore(this._api, { ...this._options, slippagePct: pct });
  }

  onStatusChange(
    callback: TStatusChangeCallback<TApi, TRes>,
  ): SwapBuilderCore<
    TApi,
    TRes,
    TSigner,
    T & { onStatusChange: TStatusChangeCallback<TApi, TRes> }
  > {
    return new SwapBuilderCore(this._api, { ...this._options, onStatusChange: callback });
  }

  async getXcmFees<TDisableFallback extends boolean = false>(
    this: SwapBuilderCore<TApi, TRes, TSigner, TBuildTransactionsBaseOptions<TApi, TRes, TSigner>>,
    options?: TGetXcmFeeBuilderOptions & { disableFallback: TDisableFallback },
  ): Promise<TGetXcmFeeResult<TDisableFallback>> {
    const disableFallback = (options?.disableFallback ?? false) as TDisableFallback;
    return getXcmFees({ ...this._options, api: this._api }, disableFallback);
  }

  async getTransferableAmount(
    this: SwapBuilderCore<TApi, TRes, TSigner, TBuildTransactionsBaseOptions<TApi, TRes, TSigner>>,
  ): Promise<bigint> {
    return getTransferableAmount({ ...this._options, api: this._api });
  }

  async getMinTransferableAmount(
    this: SwapBuilderCore<TApi, TRes, TSigner, TBuildTransactionsBaseOptions<TApi, TRes, TSigner>>,
  ): Promise<bigint> {
    return getMinTransferableAmount({ ...this._options, api: this._api });
  }

  signAndSubmit(
    this: SwapBuilderCore<TApi, TRes, TSigner, TTransferBaseOptions<TApi, TRes, TSigner>>,
  ): Promise<string[]> {
    return transfer({ ...this._options, api: this._api });
  }

  build(
    this: SwapBuilderCore<TApi, TRes, TSigner, TBuildTransactionsBaseOptions<TApi, TRes, TSigner>>,
  ): Promise<TTransactionContext<TApi, TRes>[]> {
    return buildApiTransactions({ ...this._options, api: this._api });
  }

  dryRun(
    this: SwapBuilderCore<TApi, TRes, TSigner, TBuildTransactionsBaseOptions<TApi, TRes, TSigner>>,
  ): Promise<TDryRunResult> {
    return dryRunRouter({ ...this._options, api: this._api });
  }

  getBestAmountOut(
    this: SwapBuilderCore<TApi, TRes, TSigner, TGetBestAmountOutBaseOptions<TApi, TRes, TSigner>>,
  ): Promise<{ exchange: TExchangeChain; amountOut: bigint }> {
    return getBestAmountOut({ ...this._options, api: this._api });
  }
}

export const SwapBuilder = <TApi, TRes, TSigner>(
  api: PolkadotApi<TApi, TRes, TSigner>,
): TSwapBuilder<TApi, TRes, TSigner> => new SwapBuilderCore(api);
