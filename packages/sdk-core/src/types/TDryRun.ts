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
import type { TWeight } from './TTransfer'

export type TDryRunBaseOptions<TRes> = {
  tx: TRes
  origin: TSubstrateChain
  destination: TChain
  senderAddress: string
  address: string
  currency: TCurrencyInputWithAmount
  feeAsset?: TCurrencyInput
  // Used when there is an asset swap on some hop
  swapConfig?: {
    currencyTo: TCurrencyCore
    exchangeChain: TParachain
  }
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
  Omit<TDryRunCallBaseOptions<TRes>, 'useRootOrigin'>,
  TApi,
  TRes
>

export type TDryRunCallOptions<TApi, TRes> = WithApi<TDryRunCallBaseOptions<TRes>, TApi, TRes>

export type TDryRunXcmBaseOptions = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  originLocation: any
  /**
   * The XCM instructions
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  xcm: any
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

export type TDryRunXcmOptions<TApi, TRes> = WithApi<TDryRunXcmBaseOptions, TApi, TRes>

export type TDryRunResBase = {
  /** @deprecated Use `asset` property instead. */
  currency: string
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
}

export type TDryRunChainResult = TDryRunChainSuccess | TDryRunChainFailure

export type THopInfo = {
  chain: TChain
  result: TDryRunChainResult
}

export type TDryRunChain = 'origin' | 'destination' | 'assetHub' | 'bridgeHub' | TChain

export type TDryRunResult = {
  failureReason?: string
  failureChain?: TDryRunChain
  origin: TDryRunChainResult
  destination?: TDryRunChainResult
  assetHub?: TDryRunChainResult
  bridgeHub?: TDryRunChainResult
  hops: THopInfo[]
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
  swapConfig?: {
    exchangeChain: TParachain
    currencyTo: TCurrencyCore
  }
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

export type TModuleError = {
  index: string
  error: string
}
