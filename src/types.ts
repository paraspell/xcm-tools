//  derrived from https://github.com/kodadot/packages/blob/main/minimark/src/common/types.ts

import { ApiPromise } from '@polkadot/api'
import { SubmittableExtrinsic } from '@polkadot/api-base/types'
import { NODE_NAMES, SUPPORTED_PALLETS } from './maps/consts'

export type UpdateFunction = (name: string, index: number) => string
export type Extrinsic = SubmittableExtrinsic<'promise'>
export type ExtrinsicFunction<T> = (arg: T) => Extrinsic
export type TRelayChainType = 'polkadot' | 'kusama'
export type TNode = (typeof NODE_NAMES)[number]
export type TAssetDetails = {
  assetId: string
  symbol: string
  decimals: number
}
export type TNativeAssetDetails = {
  assetId?: string
  symbol: string
  decimals: number
}
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

export type XTokensTransferInput = {
  api: ApiPromise
  currency: string
  currencyID: number | undefined
  amount: any
  addressSelection: any
  fees: number
}

export interface IXTokensTransfer {
  transferXTokens(input: XTokensTransferInput): Extrinsic
}

export type PolkadotXCMTransferInput = {
  api: ApiPromise
  header: any
  addressSelection: any
  currencySelection: any
  scenario: TScenario
}

export interface IPolkadotXCMTransfer {
  transferPolkadotXCM(input: PolkadotXCMTransferInput): Extrinsic
}

export enum Version {
  V1,
  V3
}
