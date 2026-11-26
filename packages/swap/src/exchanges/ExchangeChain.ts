import type { TPapiApi } from '@paraspell/sdk';
import { createChainClient as createChainClientPapi } from '@paraspell/sdk';
import type { TApiOrUrl, TBuilderOptions, TExchangeChain } from '@paraspell/sdk-core';
import { UnsupportedOperationError } from '@paraspell/sdk-core';
import type { TPjsApi } from '@paraspell/sdk-pjs';
import { createChainClient } from '@paraspell/sdk-pjs';
import type { ApiPromise } from '@polkadot/api';

import type {
  TDexConfigStored,
  TExchangeApiType,
  TGetAmountOutOptionsFor,
  TGetDexConfigApi,
  TSwapOptionsFor,
  TSwapResult,
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

  readonly supportsRecipient: boolean = false;

  async swapCurrency<TApi, TRes, TSigner, TCustomChain extends string = never>(
    options: TSwapOptionsFor<TApi, TRes, TSigner, TApiType, TCustomChain>,
    toDestTransactionFee: bigint,
  ): Promise<TSwapResult<TRes>> {
    const { sender, destination } = options;
    const recipient = destination ? sender : options.recipient;

    if (!this.supportsRecipient && recipient !== sender) {
      throw new UnsupportedOperationError(
        `${this.chain} cannot deposit swapped tokens to a different recipient.`,
      );
    }

    return this.buildSwap({ ...options, recipient }, toDestTransactionFee);
  }

  protected abstract buildSwap<TApi, TRes, TSigner, TCustomChain extends string = never>(
    options: TSwapOptionsFor<TApi, TRes, TSigner, TApiType, TCustomChain>,
    toDestTransactionFee: bigint,
  ): Promise<TSwapResult<TRes>>;

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
