import type {
  TAsset,
  TCurrencyInput,
  TCurrencyInputWithAmount,
  TMultiAsset,
  TMultiAssetWithFee,
  WithAmount
} from '@paraspell/assets'
import type { TPallet } from '@paraspell/pallets'
import type {
  TMultiLocation,
  TNodeDotKsmWithRelayChains,
  TNodePolkadotKusama,
  TNodeWithRelayChains,
  TRelayChain,
  Version
} from '@paraspell/sdk-common'

import type { IPolkadotApi } from '../api/IPolkadotApi'
import type { WithApi } from './TApi'

export type TPolkadotXCMTransferOptions<TApi, TRes> = {
  api: IPolkadotApi<TApi, TRes>
  destLocation: TMultiLocation
  beneficiaryLocation: TMultiLocation
  address: TAddress
  multiAsset: TMultiAsset
  overriddenAsset?: TMultiLocation | TMultiAssetWithFee[]
  scenario: TScenario
  asset: WithAmount<TAsset>
  currency: TCurrencyInputWithAmount
  feeAsset?: TAsset
  feeCurrency?: TCurrencyInput
  destination: TDestination
  paraIdTo?: number
  version: Version
  senderAddress?: string
  ahAddress?: string
  pallet?: string
  method?: string
}

export type TXTokensTransferOptions<TApi, TRes> = {
  api: IPolkadotApi<TApi, TRes>
  asset: WithAmount<TAsset>
  address: TAddress
  scenario: TScenario
  origin: TNodePolkadotKusama
  destination: TDestination
  paraIdTo?: number
  version: Version
  overriddenAsset?: TMultiLocation | TMultiAssetWithFee[]
  pallet?: string
  method?: string
  useMultiAssetTransfer?: boolean
}

export type TXTransferTransferOptions<TApi, TRes> = {
  api: IPolkadotApi<TApi, TRes>
  asset: WithAmount<TAsset>
  recipientAddress: TAddress
  origin: TNodePolkadotKusama
  paraIdTo?: number
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

export type TAddress = string | TMultiLocation
export type TDestination = TNodeWithRelayChains | TMultiLocation
export type TRelayToParaDestination = TNodePolkadotKusama | TMultiLocation

export type TSendBaseOptions = {
  /**
   * The origin node
   */
  from: TNodeDotKsmWithRelayChains
  /**
   * The destination address. A SS58 or H160 format.
   */
  address: TAddress
  /**
   * The optional sender address. A SS58 or H160 format.
   */
  senderAddress?: string
  /**
   * The optional asset hub address. A SS58 format only.
   */
  ahAddress?: string
  /**
   * The destination node or multi-location
   */
  to: TDestination
  /**
   * The currency to transfer. Either ID, symbol, multi-location, or multi-asset
   */
  currency: TCurrencyInputWithAmount
  /**
   * The optional fee asset. Either ID, symbol, or multi-location
   */
  feeAsset?: TCurrencyInput
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
export type TSendOptions<TApi, TRes> = WithApi<TSendBaseOptions, TApi, TRes>

export type WithRequiredSenderAddress<TBase> = Omit<TBase, 'senderAddress'> & {
  /**
   * The sender address. A SS58 or H160 format.
   */
  senderAddress: string
}

export type TSendBaseOptionsWithSenderAddress = WithRequiredSenderAddress<TSendBaseOptions>

export type TSendInternalOptions<TApi, TRes> = Omit<
  TSendBaseOptions,
  'from' | 'feeAsset' | 'version'
> & {
  api: IPolkadotApi<TApi, TRes>
  asset: WithAmount<TAsset>
  feeAsset?: TAsset
  feeCurrency?: TCurrencyInput
  overriddenAsset?: TMultiLocation | TMultiAssetWithFee[]
  version: Version
}

type TRelayToParaBaseOptions = {
  /**
   * The origin node
   */
  origin: TRelayChain
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
  version: Version
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
  method: TXcmPalletMethod
  includeFee: boolean
}

/**
 * Options for transferring from a relay chain to a parachain
 */
export type TRelayToParaOptions<TApi, TRes> = WithApi<TRelayToParaBaseOptions, TApi, TRes>

export type TSerializedApiCall = {
  module: TPallet | 'Utility'
  method: string
  parameters: Record<string, unknown>
}

export type TDestWeight = {
  ref_time: bigint
  proof_size: bigint
}

export type TXTransferMethod = 'transfer'

export type TXTokensMethod = 'transfer' | 'transfer_multiasset' | 'transfer_multiassets'

export type TPolkadotXcmMethod =
  | 'limited_teleport_assets'
  | 'limited_reserve_transfer_assets'
  | 'reserve_withdraw_assets'
  | 'transfer_assets'

export type TXcmPalletMethod = 'limited_teleport_assets' | 'limited_reserve_transfer_assets'

export type TWeight = {
  refTime: bigint
  proofSize: bigint
}

export type TCreateBeneficiaryOptions<TApi, TRes> = {
  api: IPolkadotApi<TApi, TRes>
  address: TAddress
  version: Version
}

export type TCreateBeneficiaryXTokensOptions<TApi, TRes> = {
  api: IPolkadotApi<TApi, TRes>
  origin: TNodeDotKsmWithRelayChains
  destination: TDestination
  address: TAddress
  version: Version
  paraId?: number
}

export type TBridgeStatus = 'Normal' | 'Halted'

export type TTransferLocalOptions<TApi, TRes> = Omit<
  TSendInternalOptions<TApi, TRes>,
  'address'
> & {
  address: string
}

export type TTransferFeeEstimates = {
  originFee: bigint
  reserveFee: bigint
}

export type TCreateBaseTransferXcmOptions = {
  chain: TNodeDotKsmWithRelayChains
  destChain: TNodeWithRelayChains
  asset: WithAmount<TAsset>
  feeAsset?: TAsset
  fees: TTransferFeeEstimates
  recipientAddress: string
  version: Version
  // refactor this
  paraIdTo?: number
}

export type TCreateTransferXcmOptions<TApi, TRes> = WithApi<
  TCreateBaseTransferXcmOptions,
  TApi,
  TRes
>

export type TCreateBaseSwapXcmOptions = {
  chain?: TNodeDotKsmWithRelayChains
  exchangeChain: TNodePolkadotKusama
  destChain?: TNodeWithRelayChains
  assetFrom: WithAmount<TAsset>
  assetTo: WithAmount<TAsset>
  currencyTo: TCurrencyInput
  senderAddress: string
  recipientAddress: string
  calculateMinAmountOut: (amountIn: bigint, assetTo?: TAsset) => Promise<bigint>
}

export type TCreateSwapXcmOptions<TApi, TRes> = WithApi<TCreateBaseSwapXcmOptions, TApi, TRes>

export type TSwapFeeEstimates = {
  originReserveFee: bigint
  exchangeFee: bigint
  destReserveFee: bigint
}

export type TCreateSwapXcmInternalOptions<TApi, TRes> = WithApi<
  TCreateBaseSwapXcmOptions,
  TApi,
  TRes
> & {
  version: Version
  fees: TSwapFeeEstimates
  // refactor this
  paraIdTo?: number
}
