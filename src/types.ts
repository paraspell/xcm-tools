//  derrived from https://github.com/kodadot/packages/blob/main/minimark/src/common/types.ts

import { type ApiPromise } from '@polkadot/api'
import { type SubmittableExtrinsic } from '@polkadot/api/types'
import {
  type NODES_WITH_RELAY_CHAINS,
  type NODE_NAMES,
  type SUPPORTED_PALLETS
} from './maps/consts'

export type UpdateFunction = (name: string, index: number) => string
export type Extrinsic = SubmittableExtrinsic<'promise'>
export type ExtrinsicFunction<T> = (arg: T) => Extrinsic
export type TRelayChainType = 'polkadot' | 'kusama'
export type TRelayChainSymbol = 'DOT' | 'KSM'
export type TNode = (typeof NODE_NAMES)[number]
export type TNodeWithRelayChains = (typeof NODES_WITH_RELAY_CHAINS)[number]
export interface TAssetDetails {
  assetId: string
  symbol?: string
  decimals?: number
}
export interface TNativeAssetDetails {
  assetId?: string
  symbol: string
  decimals: number
}
export interface TNodeAssets {
  paraId: number
  relayChainAssetSymbol: TRelayChainSymbol
  nativeAssets: TNativeAssetDetails[]
  otherAssets: TAssetDetails[]
}
export type TAssetJsonMap = Record<TNode, TNodeAssets>
export type TScenario = 'ParaToRelay' | 'ParaToPara' | 'RelayToPara'
export type Bool = 'Yes' | 'No'
export type TPallet = (typeof SUPPORTED_PALLETS)[number]
export interface TPalletMap {
  defaultPallet: TPallet
  supportedPallets: TPallet[]
}
export type TPalletJsonMap = Record<TNode, TPalletMap>

export interface TSerializedApiCall {
  module: string
  section: string
  parameters: any[]
}

export interface XTokensTransferInput {
  api: ApiPromise
  currency: string | undefined
  currencyID: string | undefined
  amount: string
  addressSelection: any
  fees: number
  scenario: TScenario
  serializedApiCallEnabled?: boolean
}

export interface IXTokensTransfer {
  transferXTokens: (input: XTokensTransferInput) => Extrinsic | TSerializedApiCall
}

export interface PolkadotXCMTransferInput {
  api: ApiPromise
  header: any
  addressSelection: any
  currencySelection: any
  scenario: TScenario
  currencySymbol: string | undefined
  serializedApiCallEnabled?: boolean
}

export interface TTransferRelayToParaOptions {
  api: ApiPromise
  destination: TNode
  address: string
  amount: string
  paraIdTo?: number
}

export interface IPolkadotXCMTransfer {
  transferPolkadotXCM: (input: PolkadotXCMTransferInput) => Extrinsic | TSerializedApiCall
}

export enum Version {
  V1 = 'V1',
  V3 = 'V3'
}
