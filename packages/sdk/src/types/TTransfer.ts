import { type ApiPromise } from '@polkadot/api'
import type { TMultiLocationHeader } from './TMultiLocation'
import { type TMultiLocation } from './TMultiLocation'
import type { TNodePolkadotKusama } from './TNode'
import { type TNode } from './TNode'
import { type SubmittableExtrinsic } from '@polkadot/api/types'
import { type TMultiAsset } from './TMultiAsset'
import type { TCurrency, TCurrencyInput, TCurrencySelectionHeaderArr } from './TCurrency'

export type Extrinsic = SubmittableExtrinsic<'promise'>

export type PolkadotXCMTransferInput = {
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

export type XTokensTransferInput = {
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

export type XTransferTransferInput = {
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

export type IPolkadotXCMTransfer = {
  transferPolkadotXCM: (input: PolkadotXCMTransferInput) => TTransferReturn
}

export type IXTokensTransfer = {
  transferXTokens: (input: XTokensTransferInput) => TTransferReturn
}

export type IXTransferTransfer = {
  transferXTransfer: (input: XTransferTransferInput) => TTransferReturn
}

export type TScenario = 'ParaToRelay' | 'ParaToPara' | 'RelayToPara'

/**
 * The XCM version.
 */
export enum Version {
  V1 = 'V1',
  V2 = 'V2',
  V3 = 'V3',
  V4 = 'V4'
}

/**
 * The supported XCM versions for asset claims.
 */
export type TVersionClaimAssets = Version.V3 | Version.V2

export enum Parents {
  ZERO = 0,
  ONE = 1,
  TWO = 2
}

export type TAmount = string | number | bigint
export type TAddress = string | TMultiLocation
export type TDestination = TNode | TMultiLocation

export type TSendBaseOptions = {
  /**
   * The destination address. A SS58 or H160 format.
   */
  address: TAddress
  /**
   * The destination node or multi-location
   */
  destination?: TDestination
  /**
   * The optional destination parachain ID
   */
  paraIdTo?: number
  /**
   * The optional overrided fee asset
   */
  feeAsset?: TCurrency
  /**
   * The optional destination API instance required for keep-alive
   */
  destApiForKeepAlive?: ApiPromise
  /**
   * The optional overrided XCM version
   */
  version?: Version
}

/**
 * Options for transferring from a parachain to another parachain or relay chain
 */
export type TSendOptions = TSendBaseOptions & {
  /**
   * The Polkadot API instance
   */
  api?: ApiPromise
  /**
   * The origin node
   */
  origin: TNode
  /**
   * The currency to transfer. Either ID, symbol, multi-location, or multi-asset
   */
  currency: TCurrencyInput
  /**
   * The amount to transfer. Can be a number, string, or bigint
   */
  amount: TAmount | null
}

export type TSendOptionsCommon = TSendOptions & {
  serializedApiCallEnabled?: boolean
}

export type TSendInternalOptions = TSendBaseOptions & {
  api: ApiPromise
  currencySymbol: string | undefined
  currencyId: string | undefined
  amount: string
  overridedCurrencyMultiLocation?: TMultiLocation | TMultiAsset[]
  serializedApiCallEnabled?: boolean
}

type TRelayToParaBaseOptions = {
  /**
   * The destination node or multi-location
   */
  destination: TDestination
  /**
   * The destination address. A SS58 or H160 format.
   */
  address: TAddress
  /**
   * The optional destination parachain ID
   */
  paraIdTo?: number
  /**
   * The optional destination API instance required for keep-alive
   */
  destApiForKeepAlive?: ApiPromise
  /**
   * The optional overrided XCM version
   */
  version?: Version
}

/**
 * Options for transferring from a relay chain to a parachain
 */
export type TRelayToParaOptions = TRelayToParaBaseOptions & {
  /**
   * The Polkadot API instance
   */
  api?: ApiPromise
  /**
   * The amount to transfer
   */
  amount: TAmount
}

export type TRelayToParaInternalOptions = TRelayToParaBaseOptions & {
  api: ApiPromise
  amount: string
}

export type TRelayToParaCommonOptions = TRelayToParaOptions & {
  serializedApiCallEnabled?: boolean
}

export type TTransferReturn = Extrinsic | TSerializedApiCall

export type TSerializedApiCall = {
  module: string
  section: string
  parameters: unknown[]
}

export type CheckKeepAliveOptions = {
  originApi: ApiPromise
  address: string
  amount: string
  originNode?: TNodePolkadotKusama
  destApi?: ApiPromise
  currencySymbol?: string
  destNode?: TNodePolkadotKusama
}

export type TDestWeight = {
  refTime: string
  proofSize: string
}

export type XTransferModule = 'xTransfer'
export type XTransferSection = 'transfer'

export type XTokensModule = 'xTokens'
export type XTokensSection = 'transfer' | 'transferMultiasset'

export type PolkadotXcmModule = 'polkadotXcm'
export type PolkadotXcmSection =
  | 'limitedTeleportAssets'
  | 'limitedReserveTransferAssets'
  | 'reserveTransferAssets'
  | 'reserveWithdrawAssets'
  | 'transferAssets'
