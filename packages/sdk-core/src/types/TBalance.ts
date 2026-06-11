import type {
  TAssetInfo,
  TCurrencyCore,
  TCurrencyInput,
  TCurrencyInputWithAmount,
  WithAmount
} from '@paraspell/assets'
import type { TChain, TSubstrateChain, Version } from '@paraspell/sdk-common'

import type { GeneralBuilder } from '../builder'
import type { WithApi } from './TApi'
import type { TTransferBaseOptionsWithSender } from './TTransfer'
import type { TTxFactory } from './TXcmFee'

export type TGetBalanceCommonOptions<TCustomChain extends string = never> = {
  /**
   * The address of the account.
   */
  address: string
  /**
   * The chain on which to query the balance.
   */
  chain: TChain | TCustomChain
}

/**
 * Retrieves the asset balance for a given account on a specified chain.
 */
export type TGetAssetBalanceOptionsBase<TCustomChain extends string = never> =
  TGetBalanceCommonOptions<TCustomChain> & {
    /**
     * The resolved asset to query balance for.
     */
    asset: TAssetInfo
  }

/**
 * Retrieves the currency balance for a given account on a specified chain.
 */
export type TGetBalanceOptionsBase<TCustomChain extends string = never> =
  TGetBalanceCommonOptions<TCustomChain> & {
    /**
     * The currency to query.
     */
    currency?: TCurrencyCore
  }

export type TGetBalanceOptions<TApi, TRes, TSigner, TCustomChain extends string = never> = WithApi<
  TGetBalanceOptionsBase<TCustomChain>,
  TApi,
  TRes,
  TSigner,
  TCustomChain
>
export type TGetAssetBalanceOptions<
  TApi,
  TRes,
  TSigner,
  TCustomChain extends string = never
> = WithApi<TGetAssetBalanceOptionsBase<TCustomChain>, TApi, TRes, TSigner, TCustomChain>

export type TGetTransferableAmountOptionsBase<TRes, TCurrency = WithAmount<TCurrencyCore>> = {
  /**
   * The sender address of the account.
   */
  sender: string
  /**
   * The chain on which to query the balance.
   */
  origin: TSubstrateChain
  /**
   * The destination chain.
   */
  destination: TChain
  /**
   * The currency to query.
   */
  currency: TCurrency
  version: Version | undefined
  buildTx: TTxFactory<TRes>
  feeAsset?: TCurrencyInput
}

export type TGetTransferableAmountOptions<
  TApi,
  TRes,
  TSigner,
  TCustomChain extends string = never,
  TCurrency = WithAmount<TCurrencyCore>
> = WithApi<TGetTransferableAmountOptionsBase<TRes, TCurrency>, TApi, TRes, TSigner, TCustomChain>

export type TPerAssetResult<TCurrency, TValue> = TCurrency extends unknown[] ? TValue[] : TValue

export type TGetMinTransferableAmountOptions<
  TApi,
  TRes,
  TSigner,
  TCustomChain extends string = never,
  TCurrency = WithAmount<TCurrencyCore>
> = WithApi<
  TGetTransferableAmountOptionsBase<TRes, TCurrency> & {
    recipient: string
    builder: GeneralBuilder<
      TApi,
      TRes,
      TSigner,
      TTransferBaseOptionsWithSender<TApi, TRes, TSigner>,
      TCustomChain
    >
  },
  TApi,
  TRes,
  TSigner,
  TCustomChain
>

export type TVerifyEdOnDestinationOptionsBase<TRes> = {
  /**
   * The origin chain.
   */
  origin: TSubstrateChain
  /**
   * The destination chain.
   */
  destination: TChain
  /**
   * The address of the account.
   */
  recipient: string
  /**
   * The account of the sender.
   */
  sender: string
  /**
   * The currency to query.
   */
  currency: TCurrencyInputWithAmount
  version: Version | undefined
  buildTx: TTxFactory<TRes>
  feeAsset?: TCurrencyInput
}

export type TVerifyEdOnDestinationOptions<
  TApi,
  TRes,
  TSigner,
  TCustomChain extends string = never
> = WithApi<TVerifyEdOnDestinationOptionsBase<TRes>, TApi, TRes, TSigner, TCustomChain>
