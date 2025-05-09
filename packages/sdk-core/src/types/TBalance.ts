import type { TCurrencyCore, WithAmount } from '@paraspell/assets'
import type {
  TNodeDotKsmWithRelayChains,
  TNodePolkadotKusama,
  TNodeWithRelayChains
} from '@paraspell/sdk-common'

import type { WithApi } from './TApi'

export type TBalanceResponse = {
  free?: string
  balance?: string
}

/**
 * Retrieves the native asset balance for a given account on a specified node.
 */
export type TGetBalanceNativeOptionsBase = {
  /**
   * The address of the account.
   */
  address: string
  /**
   * The node on which to query the balance.
   */
  node: TNodeDotKsmWithRelayChains
  /**
   * The native currency to query.
   */
  currency?: {
    symbol: string
  }
}

export type TGetBalanceNativeOptions<TApi, TRes> = WithApi<TGetBalanceNativeOptionsBase, TApi, TRes>

/**
 * Retrieves the balance of a foreign asset for a given account on a specified node.
 */
export type TGetBalanceForeignOptionsBase = {
  /*
   * The address of the account.
   */
  address: string
  /**
   * The node on which to query the balance.
   */
  node: TNodePolkadotKusama
  /**
   * The currency to query.
   */
  currency: TCurrencyCore
}

export type TGetBalanceForeignOptions<TApi, TRes> = WithApi<
  TGetBalanceForeignOptionsBase,
  TApi,
  TRes
>

/**
 * Retrieves the asset balance for a given account on a specified node.
 */
export type TGetAssetBalanceOptionsBase = {
  /**
   * The address of the account.
   */
  address: string
  /**
   * The node on which to query the balance.
   */
  node: TNodeDotKsmWithRelayChains
  /**
   * The currency to query.
   */
  currency: TCurrencyCore
}

export type TGetAssetBalanceOptions<TApi, TRes> = WithApi<TGetAssetBalanceOptionsBase, TApi, TRes>

export type TGetOriginFeeDetailsOptionsBase = {
  /**
   * The origin node.
   */
  origin: TNodeDotKsmWithRelayChains
  /**
   * The destination node.
   */
  destination: TNodeWithRelayChains
  /**
   * The currency to transfer.
   */
  currency: WithAmount<TCurrencyCore>
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

export type TGetMaxNativeTransferableAmountOptionsBase = {
  /**
   * The address of the account.
   */
  address: string
  /**
   * The node on which to query the balance.
   */
  node: TNodeDotKsmWithRelayChains
  /**
   * The currency to query.
   */
  currency?: {
    symbol: string
  }
}

export type TGetMaxNativeTransferableAmountOptions<TApi, TRes> = WithApi<
  TGetMaxNativeTransferableAmountOptionsBase,
  TApi,
  TRes
>

export type TGetMaxForeignTransferableAmountOptionsBase = {
  /**
   * The address of the account.
   */
  address: string
  /**
   * The node on which to query the balance.
   */
  node: TNodePolkadotKusama
  /**
   * The currency to query.
   */
  currency: TCurrencyCore
}

export type TGetMaxForeignTransferableAmountOptions<TApi, TRes> = WithApi<
  TGetMaxForeignTransferableAmountOptionsBase,
  TApi,
  TRes
>

export type TGetTransferableAmountOptionsBase = {
  /**
   * The address of the account.
   */
  address: string
  /**
   * The node on which to query the balance.
   */
  node: TNodeDotKsmWithRelayChains
  /**
   * The currency to query.
   */
  currency: TCurrencyCore
}

export type TGetTransferableAmountOptions<TApi, TRes> = WithApi<
  TGetTransferableAmountOptionsBase,
  TApi,
  TRes
>

export type TVerifyEdOnDestinationOptionsBase = {
  node: TNodeDotKsmWithRelayChains
  address: string
  currency: WithAmount<TCurrencyCore>
}

export type TVerifyEdOnDestinationOptions<TApi, TRes> = WithApi<
  TVerifyEdOnDestinationOptionsBase,
  TApi,
  TRes
>
