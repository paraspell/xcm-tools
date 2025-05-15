import type {
  TCurrencyInput,
  TNodeDotKsmWithRelayChains,
  TNodeWithRelayChains,
} from '@paraspell/sdk-pjs';
import type { PolkadotSigner } from 'polkadot-api';

import { buildApiTransactions, getBestAmountOut, getXcmFees, transfer } from '../transfer';
import type {
  TBuildTransactionsOptions,
  TExchangeInput,
  TGetBestAmountOutOptions,
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

  constructor(options?: T) {
    this._options = options ?? ({} as T);
  }

  /**
   * Specifies the origin node of the transfer.
   *
   * @param node - The origin node.
   * @returns The current builder instance.
   */
  from(
    node: TNodeDotKsmWithRelayChains | undefined,
  ): RouterBuilderCore<T & { from: TNodeDotKsmWithRelayChains | undefined }> {
    return new RouterBuilderCore({ ...this._options, from: node });
  }

  /**
   * Specifies the exchange node to use.
   *
   * @param node - The exchange node, or `undefined` to auto-select.
   * @returns The current builder instance.
   */
  exchange(node: TExchangeInput): RouterBuilderCore<T & { exchange: TExchangeInput }> {
    return new RouterBuilderCore({ ...this._options, exchange: node });
  }

  /**
   * Specifies the destination node of the transfer.
   *
   * @param node - The destination node.
   * @returns The current builder instance.
   */
  to(
    node: TNodeWithRelayChains | undefined,
  ): RouterBuilderCore<T & { to: TNodeWithRelayChains | undefined }> {
    return new RouterBuilderCore({ ...this._options, to: node });
  }

  /**
   * Specifies the currency to send from the origin chain.
   *
   * @param currencyFrom - The currency to send.
   * @returns The current builder instance.
   */
  currencyFrom(currency: TCurrencyInput): RouterBuilderCore<T & { currencyFrom: TCurrencyInput }> {
    return new RouterBuilderCore({ ...this._options, currencyFrom: currency });
  }

  /**
   * Specifies the currency that the origin currency will be exchanged to and received on the destination chain.
   *
   * @param currencyTo - The currency to receive.
   * @returns The current builder instance.
   */
  currencyTo(currency: TCurrencyInput): RouterBuilderCore<T & { currencyTo: TCurrencyInput }> {
    return new RouterBuilderCore({ ...this._options, currencyTo: currency });
  }

  /**
   * Specifies the amount to transfer.
   *
   * @param amount - The amount to transfer.
   * @returns The current builder instance.
   */
  amount(amount: string | bigint): RouterBuilderCore<T & { amount: string }> {
    return new RouterBuilderCore({ ...this._options, amount: amount.toString() });
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
    return new RouterBuilderCore({ ...this._options, recipientAddress: address });
  }

  /**
   * Specifies the sender address initiating the transfer.
   *
   * @param senderAddress - The sender address.
   * @returns The current builder instance.
   */
  senderAddress(address: string): RouterBuilderCore<T & { senderAddress: string }> {
    return new RouterBuilderCore({ ...this._options, senderAddress: address });
  }

  /**
   * Specifies the Polkadot signer for the transaction.
   *
   * @param signer - The Polkadot signer instance.
   * @returns The current builder instance.
   */
  signer(signer: PolkadotSigner): RouterBuilderCore<T & { signer: PolkadotSigner }> {
    return new RouterBuilderCore({ ...this._options, signer });
  }

  /**
   * Specifies the EVM sender address, required if `evmSigner` is provided. Used when dealing with EVM nodes.
   *
   * @param evmSenderAddress - The EVM sender address.
   * @returns The current builder instance.
   */
  evmSenderAddress(
    address: string | undefined,
  ): RouterBuilderCore<T & { evmSenderAddress: string | undefined }> {
    return new RouterBuilderCore({ ...this._options, evmSenderAddress: address });
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
    return new RouterBuilderCore({ ...this._options, evmSigner: signer });
  }

  /**
   * Specifies the maximum slippage percentage for swaps.
   *
   * @param slippagePct - The slippage percentage.
   * @returns The current builder instance.
   */
  slippagePct(pct: string): RouterBuilderCore<T & { slippagePct: string }> {
    return new RouterBuilderCore({ ...this._options, slippagePct: pct });
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
    return new RouterBuilderCore({ ...this._options, onStatusChange: callback });
  }

  /**
   * Returns the XCM fee for origin, exchange, and destination.
   *
   * @returns The XCM fee result.
   */
  async getXcmFees(
    this: RouterBuilderCore<TBuildTransactionsOptions>,
  ): Promise<TRouterXcmFeeResult> {
    return getXcmFees(this._options);
  }

  /**
   * Executes the transfer with the provided parameters.
   *
   * @throws Error if required parameters are missing.
   */
  build(this: RouterBuilderCore<TTransferOptions>): Promise<void> {
    return transfer(this._options);
  }

  /**
   * Builds the transactions for the transfer with the provided parameters.
   */
  buildTransactions(this: RouterBuilderCore<TBuildTransactionsOptions>) {
    return buildApiTransactions(this._options);
  }

  getBestAmountOut(this: RouterBuilderCore<TGetBestAmountOutOptions>) {
    return getBestAmountOut(this._options);
  }
}

/**
 * Creates a new `RouterBuilder` instance for constructing and executing cross-chain transfers using the XCM Router.
 *
 * **Example usage:**
 * ```typescript
 * await RouterBuilder()
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
export const RouterBuilder = () => new RouterBuilderCore();
