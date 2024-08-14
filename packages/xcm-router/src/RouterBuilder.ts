import { type Signer } from '@polkadot/types/types';
import {
  type TExchangeNode,
  transfer,
  type TTxProgressInfo,
  TransactionType,
  type TTransferOptions,
} from '.';
import { type TNodeWithRelayChains } from '@paraspell/sdk';
import { Signer as EthSigner } from 'ethers';

export interface TRouterBuilderOptions {
  from?: TNodeWithRelayChains;
  exchange?: TExchangeNode;
  to?: TNodeWithRelayChains;
  currencyFrom?: string;
  currencyTo?: string;
  amount?: string;
  injectorAddress?: string;
  evmInjectorAddress?: string;
  recipientAddress?: string;
  assetHubAddress?: string;
  slippagePct?: string;
  signer?: Signer;
  evmSigner?: Signer;
  ethSigner?: EthSigner;
  onStatusChange?: (info: TTxProgressInfo) => void;
}

export class RouterBuilderObject {
  private readonly _routerBuilderOptions: TRouterBuilderOptions;

  constructor(options: TRouterBuilderOptions = {}) {
    this._routerBuilderOptions = options;
  }

  from(node: TNodeWithRelayChains): this {
    this._routerBuilderOptions.from = node;
    return this;
  }

  exchange(node: TExchangeNode): this {
    this._routerBuilderOptions.exchange = node;
    return this;
  }

  to(node: TNodeWithRelayChains): this {
    this._routerBuilderOptions.to = node;
    return this;
  }

  currencyFrom(currencyFrom: string): this {
    this._routerBuilderOptions.currencyFrom = currencyFrom;
    return this;
  }

  currencyTo(currencyTo: string): this {
    this._routerBuilderOptions.currencyTo = currencyTo;
    return this;
  }

  amount(amount: string): this {
    this._routerBuilderOptions.amount = amount;
    return this;
  }

  recipientAddress(recipientAddress: string): this {
    this._routerBuilderOptions.recipientAddress = recipientAddress;
    return this;
  }

  injectorAddress(injectorAddress: string): this {
    this._routerBuilderOptions.injectorAddress = injectorAddress;
    return this;
  }

  assetHubAddress(assetHubAddress: string): this {
    this._routerBuilderOptions.assetHubAddress = assetHubAddress;
    return this;
  }

  signer(signer: Signer): this {
    this._routerBuilderOptions.signer = signer;
    return this;
  }

  evmInjectorAddress(evmInjectorAddress: string): this {
    this._routerBuilderOptions.evmInjectorAddress = evmInjectorAddress;
    return this;
  }

  evmSigner(evmSigner: Signer): this {
    this._routerBuilderOptions.evmSigner = evmSigner;
    return this;
  }

  ethSigner(ethSigner: EthSigner): this {
    this._routerBuilderOptions.ethSigner = ethSigner;
    return this;
  }

  slippagePct(slippagePct: string): this {
    this._routerBuilderOptions.slippagePct = slippagePct;
    return this;
  }

  onStatusChange(callback: (status: TTxProgressInfo) => void): this {
    this._routerBuilderOptions.onStatusChange = callback;
    return this;
  }

  async build(): Promise<void> {
    const requiredParams: Array<keyof TRouterBuilderOptions> = [
      'from',
      'exchange',
      'to',
      'currencyFrom',
      'currencyTo',
      'amount',
      'recipientAddress',
      'injectorAddress',
      'signer',
      'slippagePct',
    ];

    for (const param of requiredParams) {
      if (this._routerBuilderOptions[param] === undefined) {
        throw new Error(`Builder object is missing parameter: ${param}`);
      }
    }

    await transfer({
      ...(this._routerBuilderOptions as TTransferOptions),
      type: TransactionType.FULL_TRANSFER,
    });
  }
}

const RouterBuilder = (): RouterBuilderObject => new RouterBuilderObject();

export default RouterBuilder;
