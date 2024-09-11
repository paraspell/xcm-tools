import { type Signer } from '@polkadot/types/types';
import {
  type TExchangeNode,
  transfer,
  type TTxProgressInfo,
  TransactionType,
  type TTransferOptions,
} from '.';
import { TCurrencyCore, type TNodeWithRelayChains } from '@paraspell/sdk';
import { type Signer as EthSigner } from 'ethers';

export interface TRouterBuilderOptions {
  from?: TNodeWithRelayChains;
  exchange?: TExchangeNode;
  to?: TNodeWithRelayChains;
  currencyFrom?: TCurrencyCore;
  currencyTo?: TCurrencyCore;
  amount?: string;
  injectorAddress?: string;
  evmInjectorAddress?: string;
  recipientAddress?: string;
  assetHubAddress?: string;
  slippagePct?: string;
  ethSigner?: EthSigner;
  signer?: Signer;
  evmSigner?: Signer;
  type?: TransactionType;
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

  exchange(node: TExchangeNode | undefined): this {
    this._routerBuilderOptions.exchange = node;
    return this;
  }

  to(node: TNodeWithRelayChains): this {
    this._routerBuilderOptions.to = node;
    return this;
  }

  currencyFrom(currencyFrom: TCurrencyCore): this {
    this._routerBuilderOptions.currencyFrom = currencyFrom;
    return this;
  }

  currencyTo(currencyTo: TCurrencyCore): this {
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

  assetHubAddress(assetHubAddress: string | undefined): this {
    this._routerBuilderOptions.assetHubAddress = assetHubAddress;
    return this;
  }

  signer(signer: Signer): this {
    this._routerBuilderOptions.signer = signer;
    return this;
  }

  ethSigner(ethSigner: EthSigner | undefined): this {
    this._routerBuilderOptions.ethSigner = ethSigner;
    return this;
  }

  evmInjectorAddress(evmInjectorAddress: string | undefined): this {
    this._routerBuilderOptions.evmInjectorAddress = evmInjectorAddress;
    return this;
  }

  evmSigner(evmSigner: Signer | undefined): this {
    this._routerBuilderOptions.evmSigner = evmSigner;
    return this;
  }

  slippagePct(slippagePct: string): this {
    this._routerBuilderOptions.slippagePct = slippagePct;
    return this;
  }

  transactionType(transactionType: TransactionType): this {
    this._routerBuilderOptions.type = transactionType;
    return this;
  }

  onStatusChange(callback: (status: TTxProgressInfo) => void): this {
    this._routerBuilderOptions.onStatusChange = callback;
    return this;
  }

  async build(): Promise<void> {
    const requiredParams: Array<keyof TRouterBuilderOptions> = [
      'from',
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
      type: this._routerBuilderOptions.type ?? TransactionType.FULL_TRANSFER,
    });
  }
}

export const RouterBuilder = (): RouterBuilderObject => new RouterBuilderObject();
