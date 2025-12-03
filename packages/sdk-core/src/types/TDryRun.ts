import type {
  TAssetInfo,
  TCurrencyCore,
  TCurrencyInput,
  TCurrencyInputWithAmount,
  WithAmount
} from '@paraspell/assets'
import type { TChain, TParachain, TSubstrateChain } from '@paraspell/sdk-common'

import type { IPolkadotApi } from '../api'
import type { WithApi } from './TApi'
import type { TDestination, TWeight } from './TTransfer'

export type TSwapConfig = {
  currencyTo: TCurrencyCore
  exchangeChain: TParachain
}

export type TDryRunBaseOptions<TRes> = {
  tx: TRes
  origin: TSubstrateChain
  destination: TChain
  senderAddress: string
  address: string
  currency: TCurrencyInputWithAmount
  feeAsset?: TCurrencyInput
  // Used when there is an asset swap on some hop
  swapConfig?: TSwapConfig
  useRootOrigin?: boolean
  bypassOptions?: TBypassOptions
}

export type TDryRunOptions<TApi, TRes> = WithApi<TDryRunBaseOptions<TRes>, TApi, TRes>

export type TDryRunCallBaseOptions<TRes> = {
  /**
   * The transaction to dry-run
   */
  tx: TRes
  /**
   * The chain to dry-run on
   */
  chain: TSubstrateChain
  /**
   * The destination chain
   */
  destination: TDestination
  /**
   * The address to dry-run with
   */
  address: string
  /**
   * Whether to use the root origin
   */
  useRootOrigin?: boolean
  asset: WithAmount<TAssetInfo>
  bypassOptions?: TBypassOptions
  feeAsset?: TAssetInfo
}

export type TDryRunBypassOptions<TApi, TRes> = WithApi<
  Omit<TDryRunCallBaseOptions<TRes>, 'useRootOrigin' | 'destination'>,
  TApi,
  TRes
>

export type TDryRunCallOptions<TApi, TRes> = WithApi<TDryRunCallBaseOptions<TRes>, TApi, TRes>

export type TDryRunXcmBaseOptions<TRes> = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  originLocation: any
  /**
   * The XCM instructions
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  xcm: any
  /** The transaction to dry-run */
  tx: TRes
  /**
   * The chain to dry-run on
   */
  chain: TSubstrateChain
  /**
   * The origin chain
   */
  origin: TSubstrateChain
  asset: TAssetInfo
  feeAsset?: TAssetInfo
  amount: bigint
  originFee: bigint
}

export type TDryRunXcmOptions<TApi, TRes> = WithApi<TDryRunXcmBaseOptions<TRes>, TApi, TRes>

export type TDryRunResBase = {
  asset: TAssetInfo
}

export type TDryRunChainSuccess = TDryRunResBase & {
  success: true
  fee: bigint
  weight?: TWeight
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  forwardedXcms: any
  destParaId?: number
}

export type TDryRunChainFailure = TDryRunResBase & {
  success: false
  failureReason: string
  failureSubReason?: string
}

export type TDryRunChainResult = TDryRunChainSuccess | TDryRunChainFailure

export type THopInfo = {
  chain: TChain
  result: TDryRunChainResult
}

export type TDryRunChain = 'origin' | 'destination' | 'assetHub' | 'bridgeHub' | TChain

export type TDryRunResult = {
  failureReason?: string
  failureSubReason?: string
  failureChain?: TDryRunChain
  origin: TDryRunChainResult
  destination?: TDryRunChainResult
  assetHub?: TDryRunChainResult
  bridgeHub?: TDryRunChainResult
  hops: THopInfo[]
}

export type TResolveHopParams<TApi, TRes> = {
  api: IPolkadotApi<TApi, TRes>
  tx: TRes
  originChain: TSubstrateChain
  currentChain: TSubstrateChain
  destination: TDestination
  asset: TAssetInfo
  currency: TCurrencyInputWithAmount
  swapConfig?: TSwapConfig
  hasPassedExchange: boolean
}

// XCM hop traversal types

export type HopProcessParams<TApi, TRes> = {
  api: IPolkadotApi<TApi, TRes>
  currentChain: TSubstrateChain
  currentOrigin: TSubstrateChain
  currentAsset: TAssetInfo
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  forwardedXcms: any
  hasPassedExchange: boolean
  isDestination: boolean
  isAssetHub: boolean
  isBridgeHub: boolean
}

export type HopTraversalConfig<TApi, TRes, THopResult> = {
  api: IPolkadotApi<TApi, TRes>
  origin: TSubstrateChain
  destination: TChain
  currency: TCurrencyCore
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  initialForwardedXcms: any
  initialDestParaId: number | undefined
  swapConfig?: TSwapConfig
  processHop: (params: HopProcessParams<TApi, TRes>) => Promise<THopResult>
  shouldContinue: (hopResult: THopResult) => boolean
  extractNextHopData: (hopResult: THopResult) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    forwardedXcms: any
    destParaId: number | undefined
  }
}

export type HopTraversalResult<THopResult> = {
  hops: Array<{
    chain: TSubstrateChain
    result: THopResult
  }>
  assetHub?: THopResult
  bridgeHub?: THopResult
  destination?: THopResult
  lastProcessedChain?: TSubstrateChain
}

export type TBypassOptions = {
  mintFeeAssets?: boolean
  sentAssetMintMode?: 'preview' | 'bypass'
}

export enum XTokensError {
  AssetHasNoReserve = 'AssetHasNoReserve',
  NotCrossChainTransfer = 'NotCrossChainTransfer',
  InvalidDest = 'InvalidDest',
  NotCrossChainTransferableCurrency = 'NotCrossChainTransferableCurrency',
  UnweighableMessage = 'UnweighableMessage',
  XcmExecutionFailed = 'XcmExecutionFailed',
  CannotReanchor = 'CannotReanchor',
  InvalidAncestry = 'InvalidAncestry',
  InvalidAsset = 'InvalidAsset',
  DestinationNotInvertible = 'DestinationNotInvertible',
  BadVersion = 'BadVersion',
  DistinctReserveForAssetAndFee = 'DistinctReserveForAssetAndFee',
  ZeroFee = 'ZeroFee',
  ZeroAmount = 'ZeroAmount',
  TooManyAssetsBeingSent = 'TooManyAssetsBeingSent',
  AssetIndexNonExistent = 'AssetIndexNonExistent',
  FeeNotEnough = 'FeeNotEnough',
  NotSupportedLocation = 'NotSupportedLocation',
  MinXcmFeeNotDefined = 'MinXcmFeeNotDefined',
  RateLimited = 'RateLimited'
}

// Mirrors https://github.com/paritytech/polkadot-sdk/blob/master/polkadot/xcm/pallet-xcm/src/errors.rs
export enum PolkadotXcmError {
  Unreachable = 'Unreachable',
  SendFailure = 'SendFailure',
  Filtered = 'Filtered',
  UnweighableMessage = 'UnweighableMessage',
  DestinationNotInvertible = 'DestinationNotInvertible',
  Empty = 'Empty',
  CannotReanchor = 'CannotReanchor',
  TooManyAssets = 'TooManyAssets',
  InvalidOrigin = 'InvalidOrigin',
  BadVersion = 'BadVersion',
  BadLocation = 'BadLocation',
  NoSubscription = 'NoSubscription',
  AlreadySubscribed = 'AlreadySubscribed',
  CannotCheckOutTeleport = 'CannotCheckOutTeleport',
  LowBalance = 'LowBalance',
  TooManyLocks = 'TooManyLocks',
  AccountNotSovereign = 'AccountNotSovereign',
  FeesNotMet = 'FeesNotMet',
  LockNotFound = 'LockNotFound',
  InUse = 'InUse',
  REMOVED = 'REMOVED',
  InvalidAssetUnknownReserve = 'InvalidAssetUnknownReserve',
  InvalidAssetUnsupportedReserve = 'InvalidAssetUnsupportedReserve',
  TooManyReserves = 'TooManyReserves',
  LocalExecutionIncomplete = 'LocalExecutionIncomplete',
  TooManyAuthorizedAliases = 'TooManyAuthorizedAliases',
  ExpiresInPast = 'ExpiresInPast',
  AliasNotFound = 'AliasNotFound',
  LocalExecutionIncompleteWithError = 'LocalExecutionIncompleteWithError'
}

export enum PolkadotXcmExecutionError {
  Overflow = 'Overflow',
  Unimplemented = 'Unimplemented',
  UntrustedReserveLocation = 'UntrustedReserveLocation',
  UntrustedTeleportLocation = 'UntrustedTeleportLocation',
  LocationFull = 'LocationFull',
  LocationNotInvertible = 'LocationNotInvertible',
  BadOrigin = 'BadOrigin',
  InvalidLocation = 'InvalidLocation',
  AssetNotFound = 'AssetNotFound',
  FailedToTransactAsset = 'FailedToTransactAsset',
  NotWithdrawable = 'NotWithdrawable',
  LocationCannotHold = 'LocationCannotHold',
  ExceedsMaxMessageSize = 'ExceedsMaxMessageSize',
  DestinationUnsupported = 'DestinationUnsupported',
  Transport = 'Transport',
  Unroutable = 'Unroutable',
  UnknownClaim = 'UnknownClaim',
  FailedToDecode = 'FailedToDecode',
  MaxWeightInvalid = 'MaxWeightInvalid',
  NotHoldingFees = 'NotHoldingFees',
  TooExpensive = 'TooExpensive',
  Trap = 'Trap',
  ExpectationFalse = 'ExpectationFalse',
  PalletNotFound = 'PalletNotFound',
  NameMismatch = 'NameMismatch',
  VersionIncompatible = 'VersionIncompatible',
  HoldingWouldOverflow = 'HoldingWouldOverflow',
  ExportError = 'ExportError',
  ReanchorFailed = 'ReanchorFailed',
  NoDeal = 'NoDeal',
  FeesNotMet = 'FeesNotMet',
  LockError = 'LockError',
  NoPermission = 'NoPermission',
  Unanchored = 'Unanchored',
  NotDepositable = 'NotDepositable',
  TooManyAssets = 'TooManyAssets',
  UnhandledXcmVersion = 'UnhandledXcmVersion',
  WeightLimitReached = 'WeightLimitReached',
  Barrier = 'Barrier',
  WeightNotComputable = 'WeightNotComputable',
  ExceedsStackLimit = 'ExceedsStackLimit'
}

export type TModuleError = {
  index: string
  error: string
}

export type TDryRunError = {
  failureReason: string
  failureSubReason?: string
}
