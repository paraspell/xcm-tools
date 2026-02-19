import type {
  TAsset,
  TAssetInfo,
  TAssetWithFee,
  TCurrencyInput,
  TCurrencyInputWithAmount,
  WithAmount
} from '@paraspell/assets'
import type { TAssetsPallet, TPallet } from '@paraspell/pallets'
import type { TChain, TLocation, TParachain, TSubstrateChain, Version } from '@paraspell/sdk-common'

import type { IPolkadotApi } from '../api/IPolkadotApi'
import type { TRANSACT_ORIGINS } from '../constants'
import type { WithApi } from './TApi'

export type TPolkadotXCMTransferOptions<TApi, TRes, TSigner> = {
  api: IPolkadotApi<TApi, TRes, TSigner>
  chain: TSubstrateChain
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
  transactOptions?: TTransactOptions<TRes>
}

export type TXTokensTransferOptions<TApi, TRes, TSigner> = {
  api: IPolkadotApi<TApi, TRes, TSigner>
  asset: WithAmount<TAssetInfo>
  address: TAddress
  scenario: TScenario
  origin: TSubstrateChain
  destination: TDestination
  paraIdTo?: number
  version: Version
  overriddenAsset?: TLocation | TAssetWithFee[]
  pallet?: string
  method?: string
  useMultiAssetTransfer?: boolean
}

export interface IPolkadotXCMTransfer<TApi, TRes, TSigner> {
  transferPolkadotXCM: (input: TPolkadotXCMTransferOptions<TApi, TRes, TSigner>) => Promise<TRes>
}

export interface IXTokensTransfer<TApi, TRes, TSigner> {
  transferXTokens: (input: TXTokensTransferOptions<TApi, TRes, TSigner>) => TRes
}

export type TScenario = 'ParaToRelay' | 'ParaToPara' | 'RelayToPara'

export type TAddress = string | TLocation
export type TDestination = TChain | TLocation

export type TSendBaseOptions<TRes> = {
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
   * Whether to keep the account alive after the transfer.
   */
  keepAlive?: boolean
  /**
   * The optional pallet method override
   */
  method?: string
  /**
   * Hex of the encoded transaction call to apply on the destination chain
   */
  transactOptions?: TTransactOptions<TRes>
}

/**
 * Options for transferring from a parachain to another parachain or relay chain
 */
export type TSendOptions<TApi, TRes, TSigner> = WithApi<
  TSendBaseOptions<TRes>,
  TApi,
  TRes,
  TSigner
> & {
  isAmountAll: boolean
}

export type WithRequiredSenderAddress<TBase> = Omit<TBase, 'senderAddress'> & {
  /**
   * The sender address. A SS58 or H160 format.
   */
  senderAddress: string
}

export type TSendBaseOptionsWithSenderAddress<TRes> = WithRequiredSenderAddress<
  TSendBaseOptions<TRes>
>

export type TSendInternalOptions<TApi, TRes, TSigner> = Omit<
  TSendBaseOptions<TRes>,
  'from' | 'feeAsset' | 'version'
> & {
  api: IPolkadotApi<TApi, TRes, TSigner>
  assetInfo: WithAmount<TAssetInfo>
  feeAsset?: TAssetInfo
  feeCurrency?: TCurrencyInput
  overriddenAsset?: TLocation | TAssetWithFee[]
  version: Version
  isAmountAll: boolean
}

export type TTransactOrigin = (typeof TRANSACT_ORIGINS)[number]

export type TTransactOptions<TRes, TWeightType = bigint> = {
  call: string | TRes
  originKind?: TTransactOrigin
  maxWeight?: TWeight<TWeightType>
}

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

export type TXTokensMethod = 'transfer' | 'transfer_multiasset' | 'transfer_multiassets'

export type TPolkadotXcmMethod =
  | 'limited_teleport_assets'
  | 'limited_reserve_transfer_assets'
  | 'reserve_transfer_assets'
  | 'reserve_withdraw_assets'
  | 'transfer_assets'
  | 'transfer_assets_using_type_and_then'

export type TXcmPalletMethod =
  | 'limited_teleport_assets'
  | 'limited_reserve_transfer_assets'
  | 'transfer_assets_using_type_and_then'

export type TWeight<TWeightType = bigint> = {
  refTime: TWeightType
  proofSize: TWeightType
}

export type TCreateBeneficiaryOptions<TApi, TRes, TSigner> = {
  api: IPolkadotApi<TApi, TRes, TSigner>
  address: TAddress
  version: Version
}

export type TCreateBeneficiaryXTokensOptions<TApi, TRes, TSigner> = {
  api: IPolkadotApi<TApi, TRes, TSigner>
  origin: TSubstrateChain
  destination: TDestination
  address: TAddress
  version: Version
  paraId?: number
}

export type TBridgeStatus = 'Normal' | 'Halted'

export type TTransferLocalOptions<TApi, TRes, TSigner> = Omit<
  TSendInternalOptions<TApi, TRes, TSigner>,
  'address'
> & {
  address: string
  balance: bigint
}

export type TTransferFeeEstimates = {
  originFee: bigint
  reserveFee: bigint
}

export type TCreateBaseTransferXcmOptions<TRes> = {
  chain: TSubstrateChain
  destChain: TChain
  assetInfo: WithAmount<TAssetInfo>
  feeAssetInfo?: TAssetInfo
  fees: TTransferFeeEstimates
  recipientAddress: string
  senderAddress?: string
  version: Version
  useJitWithdraw?: boolean
  useFeeAssetOnHops?: boolean
  // refactor this
  paraIdTo?: number
  transactOptions?: TTransactOptions<TRes>
}

export type TCreateTransferXcmOptions<TApi, TRes, TSigner> = WithApi<
  TCreateBaseTransferXcmOptions<TRes>,
  TApi,
  TRes,
  TSigner
>

export type TCreateBaseSwapXcmOptions = {
  chain?: TSubstrateChain
  exchangeChain: TParachain
  destChain?: TChain
  assetInfoFrom: WithAmount<TAssetInfo>
  assetInfoTo: WithAmount<TAssetInfo>
  currencyTo: TCurrencyInput
  feeAssetInfo?: TAssetInfo
  senderAddress: string
  recipientAddress: string
  calculateMinAmountOut: (amountIn: bigint, assetTo?: TAssetInfo) => Promise<bigint>
}

export type TCreateSwapXcmOptions<TApi, TRes, TSigner> = WithApi<
  TCreateBaseSwapXcmOptions,
  TApi,
  TRes,
  TSigner
>

export type TSwapFeeEstimates = {
  originFee: bigint
  originReserveFee: bigint
  exchangeFee: bigint
  destReserveFee: bigint
}

export type TCreateSwapXcmInternalOptions<TApi, TRes, TSigner> = WithApi<
  TCreateBaseSwapXcmOptions,
  TApi,
  TRes,
  TSigner
> & {
  version: Version
  fees: TSwapFeeEstimates
  // refactor this
  paraIdTo?: number
}

export type TCreateEthBridgeInstructionsOptions<TApi, TRes, TSigner> = {
  api: IPolkadotApi<TApi, TRes, TSigner>
  address: TAddress
  assetInfo: TAssetInfo
  senderAddress: string
  ahAddress?: string
  version: Version
}
