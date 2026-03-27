import type {
  IPolkadotApi,
  TAmount,
  TChain,
  TCurrencyInput,
  TDryRunResult,
  TExchangeInput,
  TGetXcmFeeBuilderOptions,
  TGetXcmFeeResult,
  TStatusChangeCallback,
  TSubstrateChain,
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

export class RouterBuilderCore<
  TApi,
  TRes,
  TSigner,
  T extends Partial<TTransferBaseOptions<TApi, TRes, TSigner>> = object,
> {
  readonly _api: IPolkadotApi<TApi, TRes, TSigner>;
  readonly _options: T;
  readonly _builderOptions?: TTransferBaseOptions<TApi, TRes, TSigner>;

  constructor(api: IPolkadotApi<TApi, TRes, TSigner>, options?: T) {
    this._api = api;
    this._options = options ?? ({} as T);
  }

  /**
   * Specifies the origin chain of the transfer.
   *
   * @param chain - The origin chain.
   * @returns The current builder instance.
   */
  from(
    chain: TSubstrateChain | undefined,
  ): RouterBuilderCore<TApi, TRes, TSigner, T & { from: TSubstrateChain | undefined }> {
    return new RouterBuilderCore(this._api, {
      ...this._options,
      from: chain,
    });
  }

  /**
   * Specifies the exchange chain to use.
   *
   * @param chain - The exchange chain, or `undefined` to auto-select.
   * @returns The current builder instance.
   */
  exchange(
    chain: TExchangeInput,
  ): RouterBuilderCore<TApi, TRes, TSigner, T & { exchange: TExchangeInput }> {
    return new RouterBuilderCore(this._api, {
      ...this._options,
      exchange: normalizeExchange(chain),
    });
  }

  /**
   * Specifies the destination chain of the transfer.
   *
   * @param chain - The destination chain.
   * @returns The current builder instance.
   */
  to(
    chain: TChain | undefined,
  ): RouterBuilderCore<TApi, TRes, TSigner, T & { to: TChain | undefined }> {
    return new RouterBuilderCore(this._api, { ...this._options, to: chain });
  }

  /**
   * Specifies the currency to send from the origin chain.
   *
   * @param currencyFrom - The currency to send.
   * @returns The current builder instance.
   */
  currencyFrom(
    currency: TCurrencyInput,
  ): RouterBuilderCore<TApi, TRes, TSigner, T & { currencyFrom: TCurrencyInput }> {
    return new RouterBuilderCore(this._api, {
      ...this._options,
      currencyFrom: currency,
    });
  }

  /**
   * Specifies the currency that the origin currency will be exchanged to and received on the destination chain.
   *
   * @param currencyTo - The currency to receive.
   * @returns The current builder instance.
   */
  currencyTo(
    currency: TCurrencyInput,
  ): RouterBuilderCore<TApi, TRes, TSigner, T & { currencyTo: TCurrencyInput }> {
    return new RouterBuilderCore(this._api, {
      ...this._options,
      currencyTo: currency,
    });
  }

  /**
   * Specifies the asset used to pay XCM fees.
   *
   * @param currency - The fee asset currency, or `undefined` to use the default.
   * @returns The current builder instance.
   */
  feeAsset(
    currency: TCurrencyInput | undefined,
  ): RouterBuilderCore<TApi, TRes, TSigner, T & { feeAsset: TCurrencyInput | undefined }> {
    return new RouterBuilderCore(this._api, {
      ...this._options,
      feeAsset: currency,
    });
  }

  /**
   * Specifies the amount to transfer.
   *
   * @param amount - The amount to transfer.
   * @returns The current builder instance.
   */
  amount(amount: TAmount): RouterBuilderCore<TApi, TRes, TSigner, T & { amount: TAmount }> {
    return new RouterBuilderCore(this._api, {
      ...this._options,
      amount: amount.toString(),
    });
  }

  /**
   * Specifies the recipient address on the destination chain.
   *
   * @param recipient - The recipient address.
   * @returns The current builder instance.
   */
  recipient(
    address: string | undefined,
  ): RouterBuilderCore<TApi, TRes, TSigner, T & { recipient: string | undefined }> {
    return new RouterBuilderCore(this._api, {
      ...this._options,
      recipient: address,
    });
  }

  /**
   * Specifies the sender address initiating the transfer.
   *
   * @param senderAddress - The sender address.
   * @returns The current builder instance.
   */
  sender(address: string): RouterBuilderCore<TApi, TRes, TSigner, T & { sender: string }> {
    return new RouterBuilderCore(this._api, {
      ...this._options,
      sender: address,
    });
  }

  /**
   * Specifies the signer for the transaction.
   *
   * @param signer - The signer instance.
   * @returns The current builder instance.
   */
  signer(signer: TSigner): RouterBuilderCore<TApi, TRes, TSigner, T & { signer: TSigner }> {
    return new RouterBuilderCore(this._api, { ...this._options, signer });
  }

  /**
   * Specifies the EVM sender address, required if `evmSigner` is provided. Used when dealing with EVM chains.
   *
   * @param evmSenderAddress - The EVM sender address.
   * @returns The current builder instance.
   */
  evmSenderAddress(
    address: string | undefined,
  ): RouterBuilderCore<TApi, TRes, TSigner, T & { evmSenderAddress: string | undefined }> {
    return new RouterBuilderCore(this._api, {
      ...this._options,
      evmSenderAddress: address,
    });
  }

  /**
   * Specifies the EVM signer, required if `evmSenderAddress` is provided.
   *
   * @param evmSigner - The EVM signer.
   * @returns The current builder instance.
   */
  evmSigner(
    signer: TSigner | undefined,
  ): RouterBuilderCore<TApi, TRes, TSigner, T & { evmSigner: TSigner | undefined }> {
    return new RouterBuilderCore(this._api, {
      ...this._options,
      evmSigner: signer,
    });
  }

  /**
   * Specifies the maximum slippage percentage for swaps.
   *
   * @param slippagePct - The slippage percentage.
   * @returns The current builder instance.
   */
  slippagePct(pct: string): RouterBuilderCore<TApi, TRes, TSigner, T & { slippagePct: string }> {
    return new RouterBuilderCore(this._api, {
      ...this._options,
      slippagePct: pct,
    });
  }

  /**
   * Sets a callback to receive status updates during the transfer.
   *
   * @param callback - The status change callback.
   * @returns The current builder instance.
   */
  onStatusChange(
    callback: TStatusChangeCallback<TApi, TRes>,
  ): RouterBuilderCore<
    TApi,
    TRes,
    TSigner,
    T & { onStatusChange: TStatusChangeCallback<TApi, TRes> }
  > {
    return new RouterBuilderCore(this._api, {
      ...this._options,
      onStatusChange: callback,
    });
  }

  /**
   * Returns the XCM fee for origin, exchange, and destination.
   *
   * @returns The XCM fee result.
   */
  async getXcmFees<TDisableFallback extends boolean = false>(
    this: RouterBuilderCore<
      TApi,
      TRes,
      TSigner,
      TBuildTransactionsBaseOptions<TApi, TRes, TSigner>
    >,
    options?: TGetXcmFeeBuilderOptions & { disableFallback: TDisableFallback },
  ): Promise<TGetXcmFeeResult<TDisableFallback>> {
    const disableFallback = (options?.disableFallback ?? false) as TDisableFallback;
    return getXcmFees({ ...this._options, api: this._api }, disableFallback);
  }

  async getTransferableAmount(
    this: RouterBuilderCore<
      TApi,
      TRes,
      TSigner,
      TBuildTransactionsBaseOptions<TApi, TRes, TSigner>
    >,
  ): Promise<bigint> {
    return getTransferableAmount({ ...this._options, api: this._api });
  }

  async getMinTransferableAmount(
    this: RouterBuilderCore<
      TApi,
      TRes,
      TSigner,
      TBuildTransactionsBaseOptions<TApi, TRes, TSigner>
    >,
  ): Promise<bigint> {
    return getMinTransferableAmount({ ...this._options, api: this._api });
  }

  /**
   * Executes the transfer with the provided parameters.
   *
   * @returns An array of finalized transaction hashes (hex) in execution order.
   * @throws Error if required parameters are missing.
   */
  signAndSubmit(
    this: RouterBuilderCore<TApi, TRes, TSigner, TTransferBaseOptions<TApi, TRes, TSigner>>,
  ): Promise<string[]> {
    return transfer({ ...this._options, api: this._api });
  }

  /**
   * Builds the transactions for the transfer with the provided parameters.
   */
  build(
    this: RouterBuilderCore<
      TApi,
      TRes,
      TSigner,
      TBuildTransactionsBaseOptions<TApi, TRes, TSigner>
    >,
  ) {
    return buildApiTransactions({ ...this._options, api: this._api });
  }

  dryRun(
    this: RouterBuilderCore<
      TApi,
      TRes,
      TSigner,
      TBuildTransactionsBaseOptions<TApi, TRes, TSigner>
    >,
  ): Promise<TDryRunResult> {
    return dryRunRouter({ ...this._options, api: this._api });
  }

  getBestAmountOut(
    this: RouterBuilderCore<TApi, TRes, TSigner, TGetBestAmountOutBaseOptions<TApi, TRes, TSigner>>,
  ) {
    return getBestAmountOut({ ...this._options, api: this._api });
  }
}

export const RouterBuilder = <TApi, TRes, TSigner>(api: IPolkadotApi<TApi, TRes, TSigner>) =>
  new RouterBuilderCore(api);
