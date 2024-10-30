import type { TCurrencyCore, TNodeDotKsmWithRelayChains, TNodePolkadotKusama } from '.'
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
