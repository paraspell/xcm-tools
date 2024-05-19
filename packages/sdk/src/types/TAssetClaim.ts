import { type ApiPromise } from '@polkadot/api'
import { type TMultiAsset } from './TMultiAsset'
import { type TNodeWithRelayChains } from './TNode'
import { type TAddress, type TVersionClaimAssets } from './TTransfer'

export interface TAssetClaimOptions {
  api?: ApiPromise
  node: TNodeWithRelayChains
  multiAssets: TMultiAsset[]
  address: TAddress
  version?: TVersionClaimAssets
  serializedApiCallEnabled?: boolean
}
