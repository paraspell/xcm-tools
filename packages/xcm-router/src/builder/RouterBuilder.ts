import type { TAmount, TChain, TCurrencyInput, TSubstrateChain } from '@paraspell/sdk';
import type { PolkadotSigner } from 'polkadot-api';

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
  TBuildTransactionsOptions,
  TExchangeInput,
  TGetBestAmountOutOptions,
  TRouterBuilderOptions,
  TRouterDryRunResult,
  TRouterXcmFeeResult,
  TStatusChangeCallback,
  TTransferOptions,
} from '../types';

/**
 * Builder class for constructing and executing cross-chain transfers using the XCM Router.
 *
 */
export class RouterBuilderCore<T extends Partial<TTransferOptions> = object> {
  protected readonly _options: T;
  private readonly _builderOptions?: TRouterBuilderOptions;

  constructor(builderOptions?: TRouterBuilderOptions, options?: T) {
    this._builderOptions = builderOptions;
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
  ): RouterBuilderCore<T & { from: TSubstrateChain | undefined }> {
    return new RouterBuilderCore(this._builderOptions, { ...this._options, from: chain });
  }

  /**
   * Specifies the exchange chain to use.
   *
   * @param chain - The exchange chain, or `undefined` to auto-select.
   * @returns The current builder instance.
   */
  exchange(chain: TExchangeInput): RouterBuilderCore<T & { exchange: TExchangeInput }> {
    return new RouterBuilderCore(this._builderOptions, { ...this._options, exchange: chain });
  }

  /**
   * Specifies the destination chain of the transfer.
   *
   * @param chain - The destination chain.
   * @returns The current builder instance.
   */
  to(chain: TChain | undefined): RouterBuilderCore<T & { to: TChain | undefined }> {
    return new RouterBuilderCore(this._builderOptions, { ...this._options, to: chain });
  }

  /**
   * Specifies the currency to send from the origin chain.
   *
   * @param currencyFrom - The currency to send.
   * @returns The current builder instance.
   */
  currencyFrom(currency: TCurrencyInput): RouterBuilderCore<T & { currencyFrom: TCurrencyInput }> {
    return new RouterBuilderCore(this._builderOptions, {
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
  currencyTo(currency: TCurrencyInput): RouterBuilderCore<T & { currencyTo: TCurrencyInput }> {
    return new RouterBuilderCore(this._builderOptions, { ...this._options, currencyTo: currency });
  }

  /**
   * Specifies the asset used to pay XCM fees.
   *
   * @param currency - The fee asset currency, or `undefined` to use the default.
   * @returns The current builder instance.
   */
  feeAsset(
    currency: TCurrencyInput | undefined,
  ): RouterBuilderCore<T & { feeAsset: TCurrencyInput | undefined }> {
    return new RouterBuilderCore(this._builderOptions, { ...this._options, feeAsset: currency });
  }

  /**
   * Specifies the amount to transfer.
   *
   * @param amount - The amount to transfer.
   * @returns The current builder instance.
   */
  amount(amount: TAmount): RouterBuilderCore<T & { amount: TAmount }> {
    return new RouterBuilderCore(this._builderOptions, {
      ...this._options,
      amount: amount.toString(),
    });
  }

  /**
   * Specifies the recipient address on the destination chain.
   *
   * @param recipientAddress - The recipient address.
   * @returns The current builder instance.
   */
  recipientAddress(
    address: string | undefined,
  ): RouterBuilderCore<T & { recipientAddress: string | undefined }> {
    return new RouterBuilderCore(this._builderOptions, {
      ...this._options,
      recipientAddress: address,
    });
  }

  /**
   * Specifies the sender address initiating the transfer.
   *
   * @param senderAddress - The sender address.
   * @returns The current builder instance.
   */
  senderAddress(address: string): RouterBuilderCore<T & { senderAddress: string }> {
    return new RouterBuilderCore(this._builderOptions, {
      ...this._options,
      senderAddress: address,
    });
  }

  /**
   * Specifies the Polkadot signer for the transaction.
   *
   * @param signer - The Polkadot signer instance.
   * @returns The current builder instance.
   */
  signer(signer: PolkadotSigner): RouterBuilderCore<T & { signer: PolkadotSigner }> {
    return new RouterBuilderCore(this._builderOptions, { ...this._options, signer });
  }

  /**
   * Specifies the EVM sender address, required if `evmSigner` is provided. Used when dealing with EVM chains.
   *
   * @param evmSenderAddress - The EVM sender address.
   * @returns The current builder instance.
   */
  evmSenderAddress(
    address: string | undefined,
  ): RouterBuilderCore<T & { evmSenderAddress: string | undefined }> {
    return new RouterBuilderCore(this._builderOptions, {
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
    signer: PolkadotSigner | undefined,
  ): RouterBuilderCore<T & { evmSigner: PolkadotSigner | undefined }> {
    return new RouterBuilderCore(this._builderOptions, { ...this._options, evmSigner: signer });
  }

  /**
   * Specifies the maximum slippage percentage for swaps.
   *
   * @param slippagePct - The slippage percentage.
   * @returns The current builder instance.
   */
  slippagePct(pct: string): RouterBuilderCore<T & { slippagePct: string }> {
    return new RouterBuilderCore(this._builderOptions, { ...this._options, slippagePct: pct });
  }

  /**
   * Sets a callback to receive status updates during the transfer.
   *
   * @param callback - The status change callback.
   * @returns The current builder instance.
   */
  onStatusChange(
    callback: TStatusChangeCallback,
  ): RouterBuilderCore<T & { onStatusChange: TStatusChangeCallback }> {
    return new RouterBuilderCore(this._builderOptions, {
      ...this._options,
      onStatusChange: callback,
    });
  }

  /**
   * Returns the XCM fee for origin, exchange, and destination.
   *
   * @returns The XCM fee result.
   */
  async getXcmFees(
    this: RouterBuilderCore<TBuildTransactionsOptions>,
  ): Promise<TRouterXcmFeeResult> {
    return getXcmFees(this._options, this._builderOptions);
  }

  async getTransferableAmount(this: RouterBuilderCore<TBuildTransactionsOptions>): Promise<bigint> {
    return getTransferableAmount(this._options, this._builderOptions);
  }

  async getMinTransferableAmount(
    this: RouterBuilderCore<TBuildTransactionsOptions>,
  ): Promise<bigint> {
    return getMinTransferableAmount(this._options, this._builderOptions);
  }

  /**
   * Executes the transfer with the provided parameters.
   *
   * @throws Error if required parameters are missing.
   */
  build(this: RouterBuilderCore<TTransferOptions>): Promise<void> {
    return transfer(this._options, this._builderOptions);
  }

  /**
   * Builds the transactions for the transfer with the provided parameters.
   */
  buildTransactions(this: RouterBuilderCore<TBuildTransactionsOptions>) {
    return buildApiTransactions(this._options, this._builderOptions);
  }

  dryRun(this: RouterBuilderCore<TBuildTransactionsOptions>): Promise<TRouterDryRunResult> {
    return dryRunRouter(this._options, this._builderOptions);
  }

  getBestAmountOut(this: RouterBuilderCore<TGetBestAmountOutOptions>) {
    return getBestAmountOut(this._options, this._builderOptions);
  }
}

/**
 * Creates a new `RouterBuilder` instance for constructing and executing cross-chain transfers using the XCM Router.
 *
 * **Example usage:**
 * ```typescript
 * await RouterBuilder(options)
 *   .from('Polkadot')
 *   .exchange('HydrationDex')
 *   .to('Astar')
 *   .currencyFrom({ symbol: 'DOT' })
 *   .currencyTo({ symbol: 'ASTR' })
 *   .amount(1000000n)
 *   .slippagePct('1')
 *   .senderAddress('sender_address')
 *   .recipientAddress('recipient_address')
 *   .signer(yourSigner)
 *   .onStatusChange((status) => {
 *     console.log(status);
 *   })
 *   .build();
 * ```
 *
 * @returns A new `RouterBuilder`.
 */
export const RouterBuilder = (options?: TRouterBuilderOptions) => new RouterBuilderCore(options);
