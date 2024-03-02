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
  nativeAssetSymbol: string
  nativeAssets: TNativeAssetDetails[]
  otherAssets: TAssetDetails[]
}
export type TAssetJsonMap = Record<TNode, TNodeAssets>
export type TScenario = 'ParaToRelay' | 'ParaToPara' | 'RelayToPara'
export type TPallet = (typeof SUPPORTED_PALLETS)[number]
export interface TPalletMap {
  defaultPallet: TPallet
  supportedPallets: TPallet[]
}
export type TPalletJsonMap = Record<TNode, TPalletMap>
export type TEdJsonMap = Record<TNodeWithRelayChains, string | null>

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
  origin: TNode
  destination?: TNode
  paraIdTo?: number
  serializedApiCallEnabled?: boolean
}

export interface XTransferTransferInput {
  api: ApiPromise
  currency: string | undefined
  currencyID: string | undefined
  amount: string
  recipientAddress: string
  origin: TNode
  paraId?: number
  destination?: TNode
  serializedApiCallEnabled?: boolean
}

export interface IXTokensTransfer {
  transferXTokens: (input: XTokensTransferInput) => Extrinsic | TSerializedApiCall
}

export interface IXTransferTransfer {
  transferXTransfer: (input: XTransferTransferInput) => Extrinsic | TSerializedApiCall
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

export type TAmount = string | number | bigint

export interface TSendBaseOptions {
  address: string
  destination?: TNode
  paraIdTo?: number
  destApiForKeepAlive?: ApiPromise
}

export interface TSendOptions extends TSendBaseOptions {
  api?: ApiPromise
  origin: TNode
  currency: string | number | bigint
  amount: TAmount
}

export interface TSendOptionsCommon extends TSendOptions {
  serializedApiCallEnabled?: boolean
}

export interface TSendInternalOptions extends TSendBaseOptions {
  api: ApiPromise
  currencySymbol: string | undefined
  currencyId: string | undefined
  amount: string
  serializedApiCallEnabled?: boolean
}

interface TRelayToParaBaseOptions {
  destination: TNode
  address: string
  paraIdTo?: number
  destApiForKeepAlive?: ApiPromise
}

export interface TRelayToParaOptions extends TRelayToParaBaseOptions {
  api?: ApiPromise
  amount: TAmount
}

export interface TRelayToParaInternalOptions extends TRelayToParaBaseOptions {
  api: ApiPromise
  amount: string
}

export interface TRelayToParaCommonOptions extends TRelayToParaOptions {
  serializedApiCallEnabled?: boolean
}

export interface TOpenChannelOptions {
  api: ApiPromise
  origin: TNode
  destination: TNode
  maxSize: number
  maxMessageSize: number
}

export interface TOpenChannelInternalOptions extends TOpenChannelOptions {
  serializedApiCallEnabled?: boolean
}

export interface TCloseChannelOptions {
  api: ApiPromise
  origin: TNode
  inbound: number
  outbound: number
}

export interface TCloseChannelInternalOptions extends TCloseChannelOptions {
  serializedApiCallEnabled?: boolean
}

export interface IPolkadotXCMTransfer {
  transferPolkadotXCM: (input: PolkadotXCMTransferInput) => Extrinsic | TSerializedApiCall
}

export enum Version {
  V1 = 'V1',
  V3 = 'V3'
}

export enum Parents {
  ONE = 1,
  ZERO = 0
}

export type PolkadotXCMHeader = {
  [K in Version]?: {
    parents: Parents
    interior: any
  }
}

export interface CheckKeepAliveOptions {
  originApi: ApiPromise
  address: string
  amount: string
  originNode?: TNode
  destApi?: ApiPromise
  currencySymbol?: string
  destNode?: TNode
}
