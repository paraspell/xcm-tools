import type { TMultiAsset } from '@paraspell/assets'
import type { TNodeWithRelayChains, Version } from '@paraspell/sdk-common'

import type { WithApi } from './TApi'
import { type TAddress } from './TTransfer'

export type TAssetClaimOptionsBase = {
  node: TNodeWithRelayChains
  multiAssets: TMultiAsset[]
  address: TAddress
  version?: Version
}

export type TAssetClaimOptions<TApi, TRes> = WithApi<TAssetClaimOptionsBase, TApi, TRes>
