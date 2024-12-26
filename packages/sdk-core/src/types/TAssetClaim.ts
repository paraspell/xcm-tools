import type { WithApi } from './TApi'
import { type TMultiAsset } from './TMultiAsset'
import { type TNodeWithRelayChains } from './TNode'
import { type TAddress, type TVersionClaimAssets } from './TTransfer'

export type TAssetClaimOptionsBase = {
  node: TNodeWithRelayChains
  multiAssets: TMultiAsset[]
  address: TAddress
  version?: TVersionClaimAssets
}

export type TAssetClaimOptions<TApi, TRes> = WithApi<TAssetClaimOptionsBase, TApi, TRes>
