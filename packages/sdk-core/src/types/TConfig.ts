import type { TSubstrateChain } from '@paraspell/sdk-common'

export type TProviderEntry = {
  name: string
  endpoint: string
}

export type TChainConfig = {
  name: string
  info: string
  paraId: number
  providers: TProviderEntry[]
}

export type TChainConfigMap = Record<TSubstrateChain, TChainConfig>
