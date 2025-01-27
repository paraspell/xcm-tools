import { type Signer } from '@polkadot/types/types';
import { type TExchangeNode, transfer, type TRouterEvent, type TTransferOptions } from '.';
import type {
  TCurrencyCoreV1,
  TNodeDotKsmWithRelayChains,
  TNodeWithRelayChains,
} from '@paraspell/sdk-pjs';
import { buildApiTransactions } from './transfer/buildApiTransactions';

export type TRouterBuilderOptions = Partial<TTransferOptions>;

/**
 * Builder class for constructing and executing cross-chain transfers using the XCM Router.
 *
 */
export class RouterBuilderObject {
  private readonly _routerBuilderOptions: TRouterBuilderOptions;

  constructor(options: TRouterBuilderOptions = {}) {
    this._routerBuilderOptions = options;
  }

  /**
   * Specifies the origin node of the transfer.
   *
   * @param node - The origin node.
   * @returns The current builder instance.
   */
  from(node: TNodeDotKsmWithRelayChains): this {
    this._routerBuilderOptions.from = node;
    return this;
  }

  /**
   * Specifies the exchange node to use.
   *
   * @param node - The exchange node, or `undefined` to auto-select.
   * @returns The current builder instance.
   */
  exchange(node: TExchangeNode | undefined): this {
    this._routerBuilderOptions.exchange = node;
    return this;
  }

  /**
   * Specifies the destination node of the transfer.
   *
   * @param node - The destination node.
   * @returns The current builder instance.
   */
  to(node: TNodeWithRelayChains): this {
    this._routerBuilderOptions.to = node;
    return this;
  }

  /**
   * Specifies the currency to send from the origin chain.
   *
   * @param currencyFrom - The currency to send.
   * @returns The current builder instance.
   */
  currencyFrom(currencyFrom: TCurrencyCoreV1): this {
    this._routerBuilderOptions.currencyFrom = currencyFrom;
    return this;
  }

  /**
   * Specifies the currency that the origin currency will be exchanged to and received on the destination chain.
   *
   * @param currencyTo - The currency to receive.
   * @returns The current builder instance.
   */
  currencyTo(currencyTo: TCurrencyCoreV1): this {
    this._routerBuilderOptions.currencyTo = currencyTo;
    return this;
  }

  /**
   * Specifies the amount to transfer.
   *
   * @param amount - The amount to transfer.
   * @returns The current builder instance.
   */
  amount(amount: string): this {
    this._routerBuilderOptions.amount = amount;
    return this;
  }

  /**
   * Specifies the recipient address on the destination chain.
   *
   * @param recipientAddress - The recipient address.
   * @returns The current builder instance.
   */
  recipientAddress(recipientAddress: string): this {
    this._routerBuilderOptions.recipientAddress = recipientAddress;
    return this;
  }

  /**
   * Specifies the injector address initiating the transfer.
   *
   * @param injectorAddress - The injector address.
   * @returns The current builder instance.
   */
  injectorAddress(injectorAddress: string): this {
    this._routerBuilderOptions.injectorAddress = injectorAddress;
    return this;
  }

  /**
   * Specifies the Polkadot signer for the transaction.
   *
   * @param signer - The Polkadot signer instance.
   * @returns The current builder instance.
   */
  signer(signer: Signer): this {
    this._routerBuilderOptions.signer = signer;
    return this;
  }

  /**
   * Specifies the EVM injector address, required if `evmSigner` is provided. Used when dealing with EVM nodes.
   *
   * @param evmInjectorAddress - The EVM injector address.
   * @returns The current builder instance.
   */
  evmInjectorAddress(evmInjectorAddress: string | undefined): this {
    this._routerBuilderOptions.evmInjectorAddress = evmInjectorAddress;
    return this;
  }

  /**
   * Specifies the EVM signer, required if `evmInjectorAddress` is provided.
   *
   * @param evmSigner - The EVM signer.
   * @returns The current builder instance.
   */
  evmSigner(evmSigner: Signer | undefined): this {
    this._routerBuilderOptions.evmSigner = evmSigner;
    return this;
  }

  /**
   * Specifies the maximum slippage percentage for swaps.
   *
   * @param slippagePct - The slippage percentage.
   * @returns The current builder instance.
   */
  slippagePct(slippagePct: string): this {
    this._routerBuilderOptions.slippagePct = slippagePct;
    return this;
  }

  /**
   * Sets a callback to receive status updates during the transfer.
   *
   * @param callback - The status change callback.
   * @returns The current builder instance.
   */
  onStatusChange(callback: (status: TRouterEvent) => void): this {
    this._routerBuilderOptions.onStatusChange = callback;
    return this;
  }

  private checkRequiredParams(isApi = false): void {
    const requiredParams: Array<keyof TRouterBuilderOptions> = [
      'from',
      'to',
      'currencyFrom',
      'currencyTo',
      'amount',
      'recipientAddress',
      'injectorAddress',
      'slippagePct',
    ];

    if (!isApi) {
      requiredParams.push('signer');
    }

    for (const param of requiredParams) {
      if (this._routerBuilderOptions[param] === undefined) {
        throw new Error(`Builder object is missing parameter: ${param}`);
      }
    }
  }

  /**
   * Executes the transfer with the provided parameters.
   *
   * @throws Error if required parameters are missing.
   */
  async build(): Promise<void> {
    this.checkRequiredParams();
    await transfer(this._routerBuilderOptions as TTransferOptions);
  }

  async buildTransactions() {
    const isApi = true;
    this.checkRequiredParams(isApi);
    return buildApiTransactions(this._routerBuilderOptions as TTransferOptions);
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
 *   .injectorAddress('sender_address')
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
export const RouterBuilder = (): RouterBuilderObject => new RouterBuilderObject();
