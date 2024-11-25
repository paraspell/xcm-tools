import type { TMultiLocationHeader } from './TMultiLocation'
import { type TMultiLocation } from './TMultiLocation'
import type { TNode, TNodePolkadotKusama } from './TNode'
import { type TMultiAsset } from './TMultiAsset'
import type { TCurrency, TCurrencyInput, TCurrencySelectionHeaderArr } from './TCurrency'
import type { IPolkadotApi } from '../api/IPolkadotApi'
import type { TPallet } from './TPallet'
import type { WithApi } from './TApi'
import type { TAsset } from './TAssets'

export type THexString = `0x${string}`

export type TPolkadotXCMTransferOptions<TApi, TRes> = {
  api: IPolkadotApi<TApi, TRes>
  header: TMultiLocationHeader
  addressSelection: TMultiLocationHeader
  amount: string
  address: TAddress
  currencySelection: TCurrencySelectionHeaderArr
  scenario: TScenario
  asset: TAsset
  destination?: TDestination
  paraIdTo?: number
  feeAsset?: TCurrency
  overridedCurrency?: TMultiLocation | TMultiAsset[]
  version?: Version
  ahAddress?: string
}

export type TXTokensTransferOptions<TApi, TRes> = {
  api: IPolkadotApi<TApi, TRes>
  asset: TAsset
  amount: string
  addressSelection: TMultiLocationHeader
  fees: number
  scenario: TScenario
  origin: TNodePolkadotKusama
  destination?: TDestination
  paraIdTo?: number
  overridedCurrencyMultiLocation?: TMultiLocation | TMultiAsset[]
  feeAsset?: TCurrency
}

export type TXTransferTransferOptions<TApi, TRes> = {
  api: IPolkadotApi<TApi, TRes>
  asset: TAsset
  amount: string
  recipientAddress: TAddress
  origin: TNodePolkadotKusama
  paraId?: number
  destination?: TDestination
  overridedCurrencyMultiLocation?: TMultiLocation | TMultiAsset[]
}

export interface IPolkadotXCMTransfer {
  transferPolkadotXCM: <TApi, TRes>(input: TPolkadotXCMTransferOptions<TApi, TRes>) => Promise<TRes>
}

export interface IXTokensTransfer {
  transferXTokens: <TApi, TRes>(input: TXTokensTransferOptions<TApi, TRes>) => TRes
}

export interface IXTransferTransfer {
  transferXTransfer: <TApi, TRes>(input: TXTransferTransferOptions<TApi, TRes>) => TRes
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
export type TRelayToParaDestination = TNodePolkadotKusama | TMultiLocation

export type TSendBaseOptions<TApi, TRes> = {
  /**
   * The destination address. A SS58 or H160 format.
   */
  address: TAddress
  /**
   * The optional AssetHub address used when transfering to Ethereum
   */
  ahAddress?: string
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
  destApiForKeepAlive: IPolkadotApi<TApi, TRes>
  /**
   * The optional overrided XCM version
   */
  version?: Version
}

/**
 * Options for transferring from a parachain to another parachain or relay chain
 */
export type TSendOptions<TApi, TRes> = WithApi<TSendBaseOptions<TApi, TRes>, TApi, TRes> & {
  /**
   * The origin node
   */
  origin: TNodePolkadotKusama
  /**
   * The currency to transfer. Either ID, symbol, multi-location, or multi-asset
   */
  currency: TCurrencyInput
  /**
   * The amount to transfer. Can be a number, string, or bigint
   */
  amount: TAmount | null
}

export type TSendInternalOptions<TApi, TRes> = TSendBaseOptions<TApi, TRes> & {
  api: IPolkadotApi<TApi, TRes>
  asset: TAsset
  amount: string
  overridedCurrencyMultiLocation?: TMultiLocation | TMultiAsset[]
}

type TRelayToParaBaseOptions<TApi, TRes> = {
  /**
   * The destination node or multi-location
   */
  destination: TRelayToParaDestination
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
  destApiForKeepAlive: IPolkadotApi<TApi, TRes>
  /**
   * The optional overrided XCM version
   */
  version?: Version
  /**
   * The amount to transfer
   */
  amount: TAmount
}

export type TRelayToParaOverrides = {
  section: TXcmPalletSection
  includeFee: boolean
}

/**
 * Options for transferring from a relay chain to a parachain
 */
export type TRelayToParaOptions<TApi, TRes> = WithApi<
  TRelayToParaBaseOptions<TApi, TRes>,
  TApi,
  TRes
>

export type TSerializedApiCall = {
  module: TPallet | 'Utility'
  section: string
  parameters: Record<string, unknown>
}

export type TCheckKeepAliveOptions<TApi, TRes> = {
  originApi: IPolkadotApi<TApi, TRes>
  address: string
  amount: string
  originNode?: TNodePolkadotKusama
  destApi: IPolkadotApi<TApi, TRes>
  asset: TAsset
  destNode?: TNodePolkadotKusama
}

export type TDestWeight = {
  refTime: string
  proofSize: string
}

export type TXTransferSection = 'transfer'

export type TXTokensSection = 'transfer' | 'transfer_multiasset' | 'transfer_multiassets'

export type TPolkadotXcmSection =
  | 'limited_teleport_assets'
  | 'limited_reserve_transfer_assets'
  | 'reserve_transfer_assets'
  | 'reserve_withdraw_assets'
  | 'transfer_assets'

export type TXcmPalletSection =
  | 'limited_teleport_assets'
  | 'reserve_transfer_assets'
  | 'limited_reserve_transfer_assets'
