import type { ApiPromise } from '@polkadot/api'
import { type TMultiAsset } from './TMultiAsset'
import { type TNodeWithRelayChains } from './TNode'
import type { TApiType } from './TTransfer'
import { type TAddress, type TVersionClaimAssets } from './TTransfer'

export type TAssetClaimOptions<TApi extends TApiType = ApiPromise> = {
  api?: TApi
  node: TNodeWithRelayChains
  multiAssets: TMultiAsset[]
  address: TAddress
  version?: TVersionClaimAssets
  serializedApiCallEnabled?: boolean
}

export type TAssetClaimOptionsInternal<TApi extends TApiType = ApiPromise> =
  TAssetClaimOptions<TApi> & {
    api: TApi
  }
