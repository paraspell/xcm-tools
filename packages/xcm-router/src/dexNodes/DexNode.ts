import type { TNodePolkadotKusama, TWeight } from '@paraspell/sdk-pjs';
import { createApiInstanceForNode } from '@paraspell/sdk-pjs';
import type { ApiPromise } from '@polkadot/api';
import type BigNumber from 'bignumber.js';

import type {
  TExchangeNode,
  TGetAmountOutOptions,
  TRouterAsset,
  TSwapOptions,
  TSwapResult,
} from '../types';

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

  abstract getAmountOut(api: ApiPromise, options: TGetAmountOutOptions): Promise<bigint>;

  abstract getAssets(api: ApiPromise): Promise<TRouterAsset[]>;

  async createApiInstance(): Promise<ApiPromise> {
    return createApiInstanceForNode(this.node);
  }
}

export default ExchangeNode;
