import type { TBuilderOptions, TExchangeChain, TPapiApi, TPapiApiOrUrl } from '@paraspell/sdk';
import { createChainClient as createChainClientPapi } from '@paraspell/sdk';
import type { TParachain, TPjsApiOrUrl } from '@paraspell/sdk-pjs';
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

  abstract swapCurrency(
    api: ApiPromise,
    options: TSwapOptions,
    toDestTransactionFee: bigint,
  ): Promise<TSingleSwapResult>;

  async handleMultiSwap(
    api: ApiPromise,
    options: TSwapOptions,
    toDestTransactionFee: bigint,
  ): Promise<TMultiSwapResult> {
    const singleSwapResult = await this.swapCurrency(api, options, toDestTransactionFee);
    return {
      txs: [singleSwapResult.tx],
      amountOut: singleSwapResult.amountOut,
    };
  }

  abstract getAmountOut(api: ApiPromise, options: TGetAmountOutOptions): Promise<bigint>;

  abstract getDexConfig(api: ApiPromise): Promise<TDexConfigStored>;

  async createApiInstance(builderOptions?: TBuilderOptions<TPjsApiOrUrl>): Promise<ApiPromise> {
    return createChainClient(this.chain, builderOptions);
  }

  async createApiInstancePapi(builderOptions?: TBuilderOptions<TPapiApiOrUrl>): Promise<TPapiApi> {
    return createChainClientPapi(this.chain, builderOptions);
  }
}

export default ExchangeChain;
