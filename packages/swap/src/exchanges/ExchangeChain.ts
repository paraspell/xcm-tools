import type { TPapiApi } from '@paraspell/sdk';
import { createChainClient as createChainClientPapi } from '@paraspell/sdk';
import type { TApiOrUrl, TBuilderOptions, TExchangeChain } from '@paraspell/sdk-core';
import type { TPjsApi } from '@paraspell/sdk-pjs';
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
  private readonly _chain: TExchangeChain;

  constructor(chain: TExchangeChain) {
    this._chain = chain;
  }

  get chain(): TExchangeChain {
    return this._chain;
  }

  abstract swapCurrency<TApi, TRes, TSigner>(
    options: TSwapOptions<TApi, TRes, TSigner>,
    toDestTransactionFee: bigint,
  ): Promise<TSingleSwapResult<TRes>>;

  async handleMultiSwap<TApi, TRes, TSigner>(
    options: TSwapOptions<TApi, TRes, TSigner>,
    toDestTransactionFee: bigint,
  ): Promise<TMultiSwapResult<TRes>> {
    const singleSwapResult = await this.swapCurrency(options, toDestTransactionFee);
    return {
      txs: [singleSwapResult.tx],
      amountOut: singleSwapResult.amountOut,
    };
  }

  abstract getAmountOut<TApi, TRes, TSigner>(
    options: TGetAmountOutOptions<TApi, TRes, TSigner>,
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
