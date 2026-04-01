import type { TPapiApi } from '@paraspell/sdk';
import { createChainClient as createChainClientPapi } from '@paraspell/sdk';
import type { TApiOrUrl, TBuilderOptions, TExchangeChain } from '@paraspell/sdk-core';
import type { TParachain, TPjsApi } from '@paraspell/sdk-pjs';
import { createChainClient } from '@paraspell/sdk-pjs';
import type { ApiPromise } from '@polkadot/api';

import type {
  TDexConfigStored,
  TGetAmountOutOptions,
  TMultiSwapResult,
  TSingleSwapResult,
  TSwapOptions,
} from '../types';

abstract class ExchangeChain {
  private readonly _chain: TParachain;
  private readonly _exchangeChain: TExchangeChain;

  constructor(chain: TParachain, exchangeChain: TExchangeChain) {
    this._chain = chain;
    this._exchangeChain = exchangeChain;
  }

  get chain(): TParachain {
    return this._chain;
  }

  get exchangeChain(): TExchangeChain {
    return this._exchangeChain;
  }

  abstract swapCurrency<TApi>(
    api: ApiPromise,
    options: TSwapOptions<TApi>,
    toDestTransactionFee: bigint,
  ): Promise<TSingleSwapResult>;

  async handleMultiSwap<TApi>(
    api: ApiPromise,
    options: TSwapOptions<TApi>,
    toDestTransactionFee: bigint,
  ): Promise<TMultiSwapResult> {
    const singleSwapResult = await this.swapCurrency(api, options, toDestTransactionFee);
    return {
      txs: [singleSwapResult.tx],
      amountOut: singleSwapResult.amountOut,
    };
  }

  abstract getAmountOut<TApi>(
    api: ApiPromise,
    options: TGetAmountOutOptions<TApi>,
  ): Promise<bigint>;

  abstract getDexConfig(api: ApiPromise): Promise<TDexConfigStored>;

  async createApiInstance(
    builderOptions?: TBuilderOptions<TApiOrUrl<TPjsApi>>,
  ): Promise<ApiPromise> {
    return createChainClient(this.chain, builderOptions);
  }

  async createApiInstancePapi(
    builderOptions?: TBuilderOptions<TApiOrUrl<TPapiApi>>,
  ): Promise<TPapiApi> {
    return createChainClientPapi(this.chain, builderOptions);
  }
}

export default ExchangeChain;
