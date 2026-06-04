import type { TPapiApi } from '@paraspell/sdk';
import { createChainClient as createChainClientPapi } from '@paraspell/sdk';
import type { TApiOrUrl, TBuilderOptions, TExchangeChain } from '@paraspell/sdk-core';
import type { TPjsApi } from '@paraspell/sdk-pjs';
import { createChainClient } from '@paraspell/sdk-pjs';
import type { ApiPromise } from '@polkadot/api';

import type {
  TDexConfigStored,
  TExchangeApiType,
  TGetAmountOutOptionsFor,
  TGetDexConfigApi,
  TMultiSwapResult,
  TSingleSwapResult,
  TSwapOptionsFor,
} from '../types';

abstract class ExchangeChain<TApiType extends TExchangeApiType = TExchangeApiType> {
  private readonly _chain: TExchangeChain;

  constructor(chain: TExchangeChain) {
    this._chain = chain;
  }

  get chain(): TExchangeChain {
    return this._chain;
  }

  abstract readonly apiType: TApiType;

  abstract swapCurrency<TApi, TRes, TSigner, TCustomChain extends string = never>(
    options: TSwapOptionsFor<TApi, TRes, TSigner, TApiType, TCustomChain>,
    toDestTransactionFee: bigint,
  ): Promise<TSingleSwapResult<TRes>>;

  async handleMultiSwap<TApi, TRes, TSigner, TCustomChain extends string = never>(
    options: TSwapOptionsFor<TApi, TRes, TSigner, TApiType, TCustomChain>,
    toDestTransactionFee: bigint,
  ): Promise<TMultiSwapResult<TRes>> {
    const singleSwapResult = await this.swapCurrency(options, toDestTransactionFee);
    return {
      txs: [singleSwapResult.tx],
      amountOut: singleSwapResult.amountOut,
    };
  }

  abstract getAmountOut<TApi, TRes, TSigner, TCustomChain extends string = never>(
    options: TGetAmountOutOptionsFor<TApi, TRes, TSigner, TApiType, TCustomChain>,
  ): Promise<bigint>;

  abstract getDexConfig(api: TGetDexConfigApi<TApiType>): Promise<TDexConfigStored>;

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
