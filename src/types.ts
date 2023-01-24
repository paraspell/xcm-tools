//  derrived from https://github.com/kodadot/packages/blob/main/minimark/src/common/types.ts

import { SubmittableExtrinsic } from '@polkadot/api/types'
import { NODE_NAMES, SUPPORTED_PALLETS } from './maps/consts'

export type UpdateFunction = (name: string, index: number) => string
export type Extrinsic = SubmittableExtrinsic<'promise'>
export type ExtrinsicFunction<T> = (arg: T) => Extrinsic
export type TRelayChainType = 'polkadot' | 'kusama'
export type TNodeDetails = {
  name: string
  type: TRelayChainType
}
export type TNode = (typeof NODE_NAMES)[number]
export type TAssetDetails = {
  assetId: string
  symbol: string
  decimals: number
}
export type TNativeAssetDetails = Omit<TAssetDetails, 'assetId'>
export type TNodeAssets = {
  paraId: number
  relayChainAssetSymbol: 'KSM' | 'DOT'
  nativeAssets: TNativeAssetDetails[]
  otherAssets: TAssetDetails[]
}
export type TAssetJsonMap = Record<TNode, TNodeAssets>
export type TScenario = 'ParaToRelay' | 'ParaToPara' | 'RelayToPara'
export type Bool = 'Yes' | 'No'
export type TPallet = (typeof SUPPORTED_PALLETS)[number]
export type TPalletMap = {
  defaultPallet: TPallet
  supportedPallets: TPallet[]
}
export type TPalletJsonMap = Record<TNode, TPalletMap>
