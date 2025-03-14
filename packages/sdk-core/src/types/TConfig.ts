import type { TNodeDotKsmWithRelayChains } from '@paraspell/sdk-common'

export type TProviderEntry = {
  name: string
  endpoint: string
}

export type TNodeConfig = {
  name: string
  info: string
  paraId: number
  providers: TProviderEntry[]
}

export type TNodeConfigMap = Record<TNodeDotKsmWithRelayChains, TNodeConfig>
