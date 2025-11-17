import type {
  TAsset,
  TAssetInfo,
  TAssetWithFee,
  TCurrencyInput,
  TCurrencyInputWithAmount,
  WithAmount
} from '@paraspell/assets'
import type { TAssetsPallet, TPallet } from '@paraspell/pallets'
import type {
  TChain,
  TLocation,
  TParachain,
  TRelaychain,
  TSubstrateChain,
  Version
} from '@paraspell/sdk-common'

import type { IPolkadotApi } from '../api/IPolkadotApi'
import type { WithApi } from './TApi'

export type TPolkadotXCMTransferOptions<TApi, TRes> = {
  api: IPolkadotApi<TApi, TRes>
  destLocation: TLocation
  beneficiaryLocation: TLocation
  address: TAddress
  asset: TAsset
  overriddenAsset?: TLocation | TAssetWithFee[]
  scenario: TScenario
  assetInfo: WithAmount<TAssetInfo>
  currency: TCurrencyInputWithAmount
  feeAssetInfo?: TAssetInfo
  feeCurrency?: TCurrencyInput
  destination: TDestination
  destChain?: TChain
  paraIdTo?: number
  version: Version
  senderAddress?: string
  ahAddress?: string
  pallet?: string
  method?: string
}

export type TXTokensTransferOptions<TApi, TRes> = {
  api: IPolkadotApi<TApi, TRes>
  asset: WithAmount<TAssetInfo>
  address: TAddress
  scenario: TScenario
  origin: TParachain
  destination: TDestination
  paraIdTo?: number
  version: Version
  overriddenAsset?: TLocation | TAssetWithFee[]
  pallet?: string
  method?: string
  useMultiAssetTransfer?: boolean
}

export type TXTransferTransferOptions<TApi, TRes> = {
  api: IPolkadotApi<TApi, TRes>
  asset: WithAmount<TAssetInfo>
  recipientAddress: TAddress
  origin: TParachain
  paraIdTo?: number
  destination: TDestination
  overriddenAsset?: TLocation | TAsset[]
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

export type TAddress = string | TLocation
export type TDestination = TChain | TLocation
export type TRelayToParaDestination = TParachain | TLocation

export type TSendBaseOptions = {
  /**
   * The origin chain
   */
  from: TSubstrateChain
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
   * The destination chain or XCM location
   */
  to: TDestination
  /**
   * The currency to transfer. Either ID, symbol, location, or multi-asset
   */
  currency: TCurrencyInputWithAmount
  /**
   * The optional fee asset. Either ID, symbol, or location
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
export type TSendOptions<TApi, TRes> = WithApi<TSendBaseOptions, TApi, TRes> & {
  isAmountAll: boolean
}

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
  assetInfo: WithAmount<TAssetInfo>
  feeAsset?: TAssetInfo
  feeCurrency?: TCurrencyInput
  overriddenAsset?: TLocation | TAssetWithFee[]
  version: Version
  isAmountAll: boolean
}

type TRelayToParaBaseOptions = {
  /**
   * The origin chain
   */
  origin: TRelaychain
  /**
   * The destination chain or XCM location
   */
  destination: TRelayToParaDestination
  /**
   * The destination address. A SS58 or H160 format.
   */
  address: TAddress
  /**
   * The sender address. A SS58 or H160 format.
   */
  senderAddress?: string
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
  assetInfo: WithAmount<TAssetInfo>
  /**
   * The currency to transfer. Either ID, symbol, location, or multi-asset
   */
  currency: TCurrencyInputWithAmount
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
  transferType: 'typeAndThen' | 'teleport'
}

/**
 * Options for transferring from a relay chain to a parachain
 */
export type TRelayToParaOptions<TApi, TRes> = WithApi<TRelayToParaBaseOptions, TApi, TRes>

export type TSerializedExtrinsics = {
  module: TPallet
  method: string
  params: Record<string, unknown>
}

export type TSerializedStateQuery = {
  module: TAssetsPallet
  method: string
  params: unknown[]
}

export type TSerializedRuntimeApiQuery = {
  module: string
  method: string
  params: unknown[]
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

export type TXcmPalletMethod =
  | 'limited_teleport_assets'
  | 'limited_reserve_transfer_assets'
  | 'transfer_assets_using_type_and_then'

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
  origin: TSubstrateChain
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
  balance: bigint
}

export type TTransferFeeEstimates = {
  originFee: bigint
  reserveFee: bigint
}

export type TCreateBaseTransferXcmOptions = {
  chain: TSubstrateChain
  destChain: TChain
  assetInfo: WithAmount<TAssetInfo>
  feeAssetInfo?: TAssetInfo
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
  chain?: TSubstrateChain
  exchangeChain: TParachain
  destChain?: TChain
  assetInfoFrom: WithAmount<TAssetInfo>
  assetInfoTo: WithAmount<TAssetInfo>
  currencyTo: TCurrencyInput
  senderAddress: string
  recipientAddress: string
  calculateMinAmountOut: (amountIn: bigint, assetTo?: TAssetInfo) => Promise<bigint>
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
