import type { TMultiLocationHeader } from './TMultiLocation'
import { type TMultiLocation } from './TMultiLocation'
import type {
  TNodeDotKsmWithRelayChains,
  TNodePolkadotKusama,
  TNodeWithRelayChains,
  TRelaychain
} from './TNode'
import { type TMultiAsset } from './TMultiAsset'
import type {
  TCurrencyInputWithAmount,
  TCurrencySelectionHeaderArr,
  TMultiAssetWithFee,
  WithAmount
} from './TCurrency'
import type { IPolkadotApi } from '../api/IPolkadotApi'
import type { TPallet } from './TPallet'
import type { WithApi } from './TApi'
import type { TAsset } from './TAssets'

export type TPolkadotXCMTransferOptions<TApi, TRes> = {
  api: IPolkadotApi<TApi, TRes>
  header: TMultiLocationHeader
  addressSelection: TMultiLocationHeader
  address: TAddress
  currencySelection: TCurrencySelectionHeaderArr
  scenario: TScenario
  asset: WithAmount<TAsset>
  destination: TDestination
  paraIdTo?: number
  overriddenAsset?: TMultiLocation | TMultiAssetWithFee[]
  version?: Version
  senderAddress?: string
  pallet?: string
  method?: string
}

export type TXTokensTransferOptions<TApi, TRes> = {
  api: IPolkadotApi<TApi, TRes>
  asset: WithAmount<TAsset>
  addressSelection: TMultiLocationHeader
  fees: number
  scenario: TScenario
  origin: TNodePolkadotKusama
  destination: TDestination
  paraIdTo?: number
  overriddenAsset?: TMultiLocation | TMultiAsset[]
  pallet?: string
  method?: string
}

export type TXTransferTransferOptions<TApi, TRes> = {
  api: IPolkadotApi<TApi, TRes>
  asset: WithAmount<TAsset>
  recipientAddress: TAddress
  origin: TNodePolkadotKusama
  paraId?: number
  destination: TDestination
  overriddenAsset?: TMultiLocation | TMultiAsset[]
  pallet?: string
  method?: string
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
export type TDestination = TNodeWithRelayChains | TMultiLocation
export type TRelayToParaDestination = TNodePolkadotKusama | TMultiLocation

export type TSendBaseOptions = {
  /**
   * The destination address. A SS58 or H160 format.
   */
  address: TAddress
  /**
   * The optional sender address. A SS58
   */
  senderAddress?: string
  /**
   * The destination node or multi-location
   */
  destination: TDestination
  /**
   * The optional destination parachain ID
   */
  paraIdTo?: number
  /**
   * The optional overrided XCM version
   */
  version?: Version
  /**
   * The optional pallet override
   */
  pallet?: string
  /**
   * The optional pallet method override
   */
  method?: string
}

/**
 * Options for transferring from a parachain to another parachain or relay chain
 */
export type TSendOptions<TApi, TRes> = WithApi<TSendBaseOptions, TApi, TRes> & {
  /**
   * The origin node
   */
  origin: TNodeDotKsmWithRelayChains
  /**
   * The currency to transfer. Either ID, symbol, multi-location, or multi-asset
   */
  currency: TCurrencyInputWithAmount
}

export type TSendInternalOptions<TApi, TRes> = TSendBaseOptions & {
  api: IPolkadotApi<TApi, TRes>
  asset: WithAmount<TAsset>
  overriddenAsset?: TMultiLocation | TMultiAssetWithFee[]
}

type TRelayToParaBaseOptions = {
  /**
   * The origin node
   */
  origin: TRelaychain
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
   * The optional overrided XCM version
   */
  version?: Version
  /**
   * The DOT or KSM asset to transfer
   */
  asset: WithAmount<TAsset>
  /**
   * The optional pallet override
   */
  pallet?: string
  /**
   * The optional pallet method override
   */
  method?: string
}

export type TRelayToParaOverrides = {
  section: TXcmPalletSection
  includeFee: boolean
}

/**
 * Options for transferring from a relay chain to a parachain
 */
export type TRelayToParaOptions<TApi, TRes> = WithApi<TRelayToParaBaseOptions, TApi, TRes>

export type TSerializedApiCall = {
  module: TPallet | 'Utility'
  section: string
  parameters: Record<string, unknown>
}

export type TDestWeight = {
  ref_time: bigint
  proof_size: bigint
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
