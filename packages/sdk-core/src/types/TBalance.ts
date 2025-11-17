import type {
  TAssetInfo,
  TCurrencyCore,
  TCurrencyInput,
  WithAmount,
  WithComplexAmount
} from '@paraspell/assets'
import type { TChain, TSubstrateChain } from '@paraspell/sdk-common'

import type { GeneralBuilder } from '../builder'
import type { WithApi } from './TApi'
import type { TSendBaseOptionsWithSenderAddress } from './TTransfer'
import type { TTxFactory } from './TXcmFee'

/**
 * Retrieves the native asset balance for a given account on a specified chain.
 */
export type TGetBalanceNativeOptionsBase = {
  /**
   * The address of the account.
   */
  address: string
  /**
   * The chain on which to query the balance.
   */
  chain: TChain
  /**
   * The native currency to query.
   */
  currency?: {
    symbol: string
  }
}

export type TGetBalanceNativeOptions<TApi, TRes> = WithApi<TGetBalanceNativeOptionsBase, TApi, TRes>

/**
 * Retrieves the balance of a foreign asset for a given account on a specified chain.
 */
export type TGetBalanceForeignOptionsBase = {
  /*
   * The address of the account.
   */
  address: string
  /**
   * The chain on which to query the balance.
   */
  chain: TSubstrateChain
}

export type TGetBalanceForeignOptions<TApi, TRes> = WithApi<
  TGetBalanceForeignOptionsBase & {
    /**
     * The currency to query.
     */
    currency: TCurrencyCore
  },
  TApi,
  TRes
>

export type TGetBalanceForeignByAssetOptions<TApi, TRes> = WithApi<
  TGetBalanceForeignOptionsBase & {
    /**
     * The asset to query balance for.
     */
    asset: TAssetInfo
  },
  TApi,
  TRes
>

export type TGetBalanceCommonOptions = {
  /**
   * The address of the account.
   */
  address: string
  /**
   * The chain on which to query the balance.
   */
  chain: TChain
}

/**
 * Retrieves the asset balance for a given account on a specified chain.
 */
export type TGetAssetBalanceOptionsBase = TGetBalanceCommonOptions & {
  /**
   * The resolved asset to query balance for.
   */
  asset: TAssetInfo
}

/**
 * Retrieves the currency balance for a given account on a specified chain.
 */
export type TGetBalanceOptionsBase = TGetBalanceCommonOptions & {
  /**
   * The currency to query.
   */
  currency: TCurrencyCore
}

export type TGetBalanceOptions<TApi, TRes> = WithApi<TGetBalanceOptionsBase, TApi, TRes>
export type TGetAssetBalanceOptions<TApi, TRes> = WithApi<TGetAssetBalanceOptionsBase, TApi, TRes>

export type TGetOriginFeeDetailsOptionsBase = {
  /**
   * The origin chain.
   */
  origin: TSubstrateChain
  /**
   * The destination chain.
   */
  destination: TChain
  /**
   * The currency to transfer.
   */
  currency: WithComplexAmount<TCurrencyCore>
  /**
   * The origin account.
   */
  account: string
  /**
   * The destination account.
   */
  accountDestination: string
  /**
   * The address of the account.
   */
  ahAddress?: string
  /**
   * The fee margin percentage.
   */
  feeMarginPercentage?: number
}

export type TGetOriginFeeDetailsOptions<TApi, TRes> = WithApi<
  TGetOriginFeeDetailsOptionsBase,
  TApi,
  TRes
>

export type TGetTransferableAmountOptionsBase<TRes> = {
  /**
   * The sender address of the account.
   */
  senderAddress: string
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
  currency: WithAmount<TCurrencyCore>
  /**
   * The transactions
   */
  buildTx: TTxFactory<TRes>
  feeAsset?: TCurrencyInput
}

export type TGetTransferableAmountOptions<TApi, TRes> = WithApi<
  TGetTransferableAmountOptionsBase<TRes>,
  TApi,
  TRes
>

export type TGetMinTransferableAmountOptions<TApi, TRes> = WithApi<
  TGetTransferableAmountOptionsBase<TRes> & {
    address: string
    builder: GeneralBuilder<TApi, TRes, TSendBaseOptionsWithSenderAddress>
  },
  TApi,
  TRes
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
  address: string
  /**
   * The account of the sender.
   */
  senderAddress: string
  /**
   * The currency to query.
   */
  currency: WithAmount<TCurrencyCore>
  /**
   * The transactions
   */
  buildTx: TTxFactory<TRes>
  feeAsset?: TCurrencyInput
}

export type TVerifyEdOnDestinationOptions<TApi, TRes> = WithApi<
  TVerifyEdOnDestinationOptionsBase<TRes>,
  TApi,
  TRes
>
