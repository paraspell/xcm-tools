import { type ApiPromise } from '@polkadot/api'
import { TMultiLocationHeader, type TMultiLocation } from './TMultiLocation'
import { TNodePolkadotKusama, type TNode } from './TNode'
import { type SubmittableExtrinsic } from '@polkadot/api/types'
import { type TMultiAsset } from './TMultiAsset'
import { TCurrency, TCurrencyInput, TCurrencySelectionHeaderArr } from './TCurrency'

export type Extrinsic = SubmittableExtrinsic<'promise'>

export interface PolkadotXCMTransferInput {
  api: ApiPromise
  header: TMultiLocationHeader
  addressSelection: TMultiLocationHeader
  amount: string
  address: TAddress
  currencySelection: TCurrencySelectionHeaderArr
  scenario: TScenario
  currencySymbol: string | undefined
  currencyId: string | undefined
  destination?: TDestination
  paraIdTo?: number
  feeAsset?: TCurrency
  overridedCurrency?: TMultiLocation | TMultiAsset[]
  serializedApiCallEnabled?: boolean
}

export interface XTokensTransferInput {
  api: ApiPromise
  currency: string | undefined
  currencyID: string | undefined
  amount: string
  addressSelection: TMultiLocationHeader
  fees: number
  scenario: TScenario
  origin: TNode
  destination?: TDestination
  paraIdTo?: number
  overridedCurrencyMultiLocation?: TMultiLocation | TMultiAsset[]
  feeAsset?: TCurrency
  serializedApiCallEnabled?: boolean
}

export interface XTransferTransferInput {
  api: ApiPromise
  currency: string | undefined
  currencyID: string | undefined
  amount: string
  recipientAddress: TAddress
  origin: TNode
  paraId?: number
  destination?: TDestination
  overridedCurrencyMultiLocation?: TMultiLocation | TMultiAsset[]
  serializedApiCallEnabled?: boolean
}

export interface IPolkadotXCMTransfer {
  transferPolkadotXCM: (input: PolkadotXCMTransferInput) => Extrinsic | TSerializedApiCall
}

export interface IXTokensTransfer {
  transferXTokens: (input: XTokensTransferInput) => Extrinsic | TSerializedApiCall
}

export interface IXTransferTransfer {
  transferXTransfer: (input: XTransferTransferInput) => Extrinsic | TSerializedApiCall
}

export type TScenario = 'ParaToRelay' | 'ParaToPara' | 'RelayToPara'

export enum Version {
  V1 = 'V1',
  V2 = 'V2',
  V3 = 'V3',
  V4 = 'V4'
}

export type TVersionClaimAssets = Version.V3 | Version.V2

export enum Parents {
  ZERO = 0,
  ONE = 1,
  TWO = 2
}

export type TAmount = string | number | bigint
export type TAddress = string | TMultiLocation
export type TDestination = TNode | TMultiLocation

export interface TSendBaseOptions {
  address: TAddress
  destination?: TDestination
  paraIdTo?: number
  feeAsset?: TCurrency
  destApiForKeepAlive?: ApiPromise
  version?: Version
}

export interface TSendOptions extends TSendBaseOptions {
  api?: ApiPromise
  origin: TNode
  currency: TCurrencyInput
  amount: TAmount | null
}

export interface TSendOptionsCommon extends TSendOptions {
  serializedApiCallEnabled?: boolean
}

export interface TSendInternalOptions extends TSendBaseOptions {
  api: ApiPromise
  currencySymbol: string | undefined
  currencyId: string | undefined
  amount: string
  overridedCurrencyMultiLocation?: TMultiLocation | TMultiAsset[]
  serializedApiCallEnabled?: boolean
}

interface TRelayToParaBaseOptions {
  destination: TDestination
  address: TAddress
  paraIdTo?: number
  destApiForKeepAlive?: ApiPromise
  version?: Version
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

export interface TSerializedApiCall {
  module: string
  section: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  parameters: any[]
}

export interface CheckKeepAliveOptions {
  originApi: ApiPromise
  address: string
  amount: string
  originNode?: TNodePolkadotKusama
  destApi?: ApiPromise
  currencySymbol?: string
  destNode?: TNodePolkadotKusama
}
