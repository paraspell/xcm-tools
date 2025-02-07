import type { TNodePolkadotKusama } from '@paraspell/sdk-pjs';
import { createApiInstanceForNode } from '@paraspell/sdk-pjs';
import type { TSwapResult, TSwapOptions, TAssets, TExchangeNode, TWeight } from '../types';
import type { ApiPromise } from '@polkadot/api';
import type BigNumber from 'bignumber.js';

abstract class ExchangeNode {
  private readonly _node: TNodePolkadotKusama;
  private readonly _exchangeNode: TExchangeNode;

  constructor(node: TNodePolkadotKusama, exchangeNode: TExchangeNode) {
    this._node = node;
    this._exchangeNode = exchangeNode;
  }

  get node(): TNodePolkadotKusama {
    return this._node;
  }

  get exchangeNode(): TExchangeNode {
    return this._exchangeNode;
  }

  abstract swapCurrency(
    api: ApiPromise,
    options: TSwapOptions,
    toDestTransactionFee: BigNumber,
    toExchangeTxWeight: TWeight,
  ): Promise<TSwapResult>;

  abstract getAssets(api: ApiPromise): Promise<TAssets>;

  async createApiInstance(): Promise<ApiPromise> {
    return createApiInstanceForNode(this.node);
  }
}

export default ExchangeNode;
