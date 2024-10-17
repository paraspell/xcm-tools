import type { TCurrencyCore, TNodePolkadotKusama, TNodeWithRelayChains } from '.'
import type { WithApi } from './TApi'

export type TBalanceResponse = {
  free?: string
  balance?: string
}

export type TGetBalanceNativeOptionsBase = {
  address: string
  node: TNodeWithRelayChains
}

export type TGetBalanceNativeOptions<TApi, TRes> = WithApi<TGetBalanceNativeOptionsBase, TApi, TRes>

export type TGetBalanceForeignOptionsBase = {
  address: string
  node: TNodePolkadotKusama
  currency: TCurrencyCore
}

export type TGetBalanceForeignOptions<TApi, TRes> = WithApi<
  TGetBalanceForeignOptionsBase,
  TApi,
  TRes
>
