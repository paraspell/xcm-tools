import type { TMultiAsset } from '@paraspell/assets'
import type { TNodeWithRelayChains } from '@paraspell/sdk-common'

import type { WithApi } from './TApi'
import { type TAddress, type TVersionClaimAssets } from './TTransfer'

export type TAssetClaimOptionsBase = {
  node: TNodeWithRelayChains
  multiAssets: TMultiAsset[]
  address: TAddress
  version?: TVersionClaimAssets
}

export type TAssetClaimOptions<TApi, TRes> = WithApi<TAssetClaimOptionsBase, TApi, TRes>
