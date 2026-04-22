import type {
  TAsset,
  TAssetInfo,
  TAssetWithFee,
  TCurrencyInput,
  TCurrencyInputWithAmount,
  WithAmount
} from '@paraspell/assets'
import type { TAssetsPallet, TPallet } from '@paraspell/pallets'
import type { TChain, TLocation, TSubstrateChain, Version } from '@paraspell/sdk-common'

import type { PolkadotApi } from '../api/PolkadotApi'
import type { TRANSACT_ORIGINS } from '../constants'
import type { WithApi } from './TApi'
import type { TExchangeChain, TSwapOptions } from './TSwap'

export type TPolkadotXCMTransferOptions<TApi, TRes, TSigner> = {
  api: PolkadotApi<TApi, TRes, TSigner>
  chain: TSubstrateChain
  beneficiaryLocation: TLocation
  recipient: TAddress
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
  sender?: string
  ahAddress?: string
  pallet?: string
  method?: string
  transactOptions?: TTransactOptions<TRes>
}

export type TXTokensTransferOptions<TApi, TRes, TSigner> = {
  api: PolkadotApi<TApi, TRes, TSigner>
  asset: WithAmount<TAssetInfo>
  recipient: TAddress
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

export type TTransferBaseOptions<TApi, TRes, TSigner> = {
  /**
   * The origin chain
   */
  from: TChain
  /**
   * The destination address. A SS58 or H160 format.
   */
  recipient: TAddress
  /**
   * The optional sender address. A SS58 or H160 format.
   */
  sender?: string
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
  /**
   * The optional swap options
   */
  swapOptions?: TSwapOptions<TApi, TRes, TSigner>
}

/**
 * Options for transferring from a parachain to another parachain or relay chain
 */
export type TTransferOptions<TApi, TRes, TSigner> = WithApi<
  TTransferBaseOptions<TApi, TRes, TSigner>,
  TApi,
  TRes,
  TSigner
> & {
  isAmountAll: boolean
}

export type TSubstrateTransferBaseOptions<TApi, TRes, TSigner> = Omit<
  TTransferBaseOptions<TApi, TRes, TSigner>,
  'from'
> & {
  from: TSubstrateChain
}

export type TSubstrateTransferOptions<TApi, TRes, TSigner> = Omit<
  TTransferOptions<TApi, TRes, TSigner>,
  'from'
> & {
  from: TSubstrateChain
}

export type WithRequiredSender<TBase> = Omit<TBase, 'sender'> & {
  /**
   * The sender address. A SS58 or H160 format.
   */
  sender: string
}

export type WithRequiredSwapOptions<TBase, TApi, TRes, TSigner> = Omit<TBase, 'swapOptions'> & {
  swapOptions: TSwapOptions<TApi, TRes, TSigner>
}

export type TTransferOptionsWithSwap<TApi, TRes, TSigner> = WithRequiredSwapOptions<
  Omit<TSubstrateTransferOptions<TApi, TRes, TSigner>, 'isAmountAll'>,
  TApi,
  TRes,
  TSigner
>

export type TTransferBaseOptionsWithSwap<TApi, TRes, TSigner> = WithRequiredSwapOptions<
  TTransferBaseOptions<TApi, TRes, TSigner>,
  TApi,
  TRes,
  TSigner
>

export type TTransferBaseOptionsWithSender<TApi, TRes, TSigner> = WithRequiredSender<
  TTransferBaseOptions<TApi, TRes, TSigner>
>

export type TSubstrateTransferBaseOptionsWithSender<TApi, TRes, TSigner> = WithRequiredSender<
  TSubstrateTransferBaseOptions<TApi, TRes, TSigner>
>

export type TTransferInternalOptions<TApi, TRes, TSigner> = Omit<
  TTransferBaseOptions<TApi, TRes, TSigner>,
  'from' | 'feeAsset' | 'version'
> & {
  api: PolkadotApi<TApi, TRes, TSigner>
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
  api: PolkadotApi<TApi, TRes, TSigner>
  address: TAddress
  version: Version
}

export type TCreateBeneficiaryXTokensOptions<TApi, TRes, TSigner> = {
  api: PolkadotApi<TApi, TRes, TSigner>
  origin: TSubstrateChain
  destination: TDestination
  recipient: TAddress
  version: Version
  paraId?: number
}

export type TBridgeStatus = 'Normal' | 'Halted'

export type TTransferLocalOptions<TApi, TRes, TSigner> = Omit<
  TTransferInternalOptions<TApi, TRes, TSigner>,
  'recipient'
> & {
  recipient: string
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
  recipient: string
  sender?: string
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
  exchangeChain: TExchangeChain
  destChain?: TChain
  assetInfoFrom: WithAmount<TAssetInfo>
  assetInfoTo: WithAmount<TAssetInfo>
  currencyTo: TCurrencyInput
  feeAssetInfo?: TAssetInfo
  sender: string
  recipient: string
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
  api: PolkadotApi<TApi, TRes, TSigner>
  recipient: TAddress
  assetInfo: TAssetInfo
  sender: string
  ahAddress?: string
  version: Version
}
