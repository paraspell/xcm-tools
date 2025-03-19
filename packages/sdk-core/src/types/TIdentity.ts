import type { TNodeWithRelayChains } from '@paraspell/sdk-common'

import type { WithApi } from './TApi'

export type TIdentity = {
  display?: string
  legal?: string
  web?: string
  matrix?: string
  email?: string
  image?: string
  twitter?: string
  github?: string
  discord?: string
}

export type TCreateXcmIdentityCallOptionsBase = {
  from: Extract<TNodeWithRelayChains, 'AssetHubPolkadot' | 'AssetHubKusama' | 'Polkadot' | 'Kusama'>
  xcmFee?: bigint
  identity: TIdentity
  regIndex: number
  maxRegistrarFee: bigint
}

export type TCreateXcmIdentityCallOptions<TApi, TRes> = WithApi<
  TCreateXcmIdentityCallOptionsBase,
  TApi,
  TRes
>
