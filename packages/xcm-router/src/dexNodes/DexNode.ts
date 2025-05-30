import type { TPapiApi } from '@paraspell/sdk';
import { createApiInstanceForNode as createApiInstanceForNodePapi } from '@paraspell/sdk';
import type { TNodePolkadotKusama } from '@paraspell/sdk-pjs';
import { createApiInstanceForNode } from '@paraspell/sdk-pjs';
import type { ApiPromise } from '@polkadot/api';
import type BigNumber from 'bignumber.js';

import type {
  TDexConfig,
  TExchangeNode,
  TGetAmountOutOptions,
  TMultiSwapResult,
  TSingleSwapResult,
  TSwapOptions,
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
  ): Promise<TSingleSwapResult>;

  async handleMultiSwap(
    api: ApiPromise,
    options: TSwapOptions,
    toDestTransactionFee: BigNumber,
  ): Promise<TMultiSwapResult> {
    const singleSwapResult = await this.swapCurrency(api, options, toDestTransactionFee);
    return {
      txs: [singleSwapResult.tx],
      amountOut: singleSwapResult.amountOut,
    };
  }

  abstract getAmountOut(api: ApiPromise, options: TGetAmountOutOptions): Promise<bigint>;

  abstract getDexConfig(api: ApiPromise): Promise<TDexConfig>;

  async createApiInstance(): Promise<ApiPromise> {
    return createApiInstanceForNode(this.node);
  }

  async createApiInstancePapi(): Promise<TPapiApi> {
    return createApiInstanceForNodePapi(this.node);
  }
}

export default ExchangeNode;
