import type { TMultiLocationHeader } from './TMultiLocation'
import { type TMultiLocation } from './TMultiLocation'
import type { TNodePolkadotKusama } from './TNode'
import { type TNode } from './TNode'
import { type TMultiAsset } from './TMultiAsset'
import type { TCurrency, TCurrencyInput, TCurrencySelectionHeaderArr } from './TCurrency'
import type { IPolkadotApi } from '../api/IPolkadotApi'
import type { TPallet } from './TPallet'
import type { WithApi } from './TApi'

export type HexString = `0x${string}`

export type PolkadotXCMTransferInput<TApi, TRes> = {
  api: IPolkadotApi<TApi, TRes>
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

export type XTokensTransferInput<TApi, TRes> = {
  api: IPolkadotApi<TApi, TRes>
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

export type XTransferTransferInput<TApi, TRes> = {
  api: IPolkadotApi<TApi, TRes>
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
  transferPolkadotXCM: <TApi, TRes>(
    input: PolkadotXCMTransferInput<TApi, TRes>
  ) => TTransferReturn<TRes>
}

export type IXTokensTransfer = {
  transferXTokens: <TApi, TRes>(input: XTokensTransferInput<TApi, TRes>) => TTransferReturn<TRes>
}

export type IXTransferTransfer = {
  transferXTransfer: <TApi, TRes>(
    input: XTransferTransferInput<TApi, TRes>
  ) => TTransferReturn<TRes>
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

export type TSendBaseOptions<TApi, TRes> = {
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

export type TSendInternalOptions<TApi, TRes> = TSendBaseOptions<TApi, TRes> & {
  api: IPolkadotApi<TApi, TRes>
  currencySymbol: string | undefined
  currencyId: string | undefined
  amount: string
  overridedCurrencyMultiLocation?: TMultiLocation | TMultiAsset[]
  serializedApiCallEnabled?: boolean
}

type TRelayToParaBaseOptions<TApi, TRes> = {
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

/**
 * Options for transferring from a relay chain to a parachain
 */
export type TRelayToParaOptions<TApi, TRes> = WithApi<
  TRelayToParaBaseOptions<TApi, TRes>,
  TApi,
  TRes
>

export type TTransferReturn<TRes> = TRes | TSerializedApiCall

export type TSerializedApiCall = {
  module: string
  section: string
  parameters: unknown[]
}

export type TSerializedApiCallV2 = {
  module: TPallet | 'Utility'
  section: string
  parameters: Record<string, unknown>
}

export type CheckKeepAliveOptions<TApi, TRes> = {
  originApi: IPolkadotApi<TApi, TRes>
  address: string
  amount: string
  originNode?: TNodePolkadotKusama
  destApi: IPolkadotApi<TApi, TRes>
  currencySymbol?: string
  destNode?: TNodePolkadotKusama
}

export type TDestWeight = {
  refTime: string
  proofSize: string
}

export type XTransferSection = 'transfer'

export type XTokensSection = 'transfer' | 'transfer_multiasset' | 'transfer_multiassets'

export type PolkadotXcmSection =
  | 'limited_teleport_assets'
  | 'limited_reserve_transfer_assets'
  | 'reserve_transfer_assets'
  | 'reserve_withdraw_assets'
  | 'transfer_assets'
