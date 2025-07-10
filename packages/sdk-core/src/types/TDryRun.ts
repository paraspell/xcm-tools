import type {
  TAsset,
  TCurrencyCore,
  TCurrencyInput,
  TCurrencyInputWithAmount
} from '@paraspell/assets'
import type {
  TNodeDotKsmWithRelayChains,
  TNodePolkadotKusama,
  TNodeWithRelayChains
} from '@paraspell/sdk-common'

import type { IPolkadotApi } from '../api'
import type { WithApi } from './TApi'
import type { TWeight } from './TTransfer'

export type TDryRunBaseOptions<TRes> = {
  tx: TRes
  origin: TNodeDotKsmWithRelayChains
  destination: TNodeWithRelayChains
  senderAddress: string
  address: string
  currency: TCurrencyInputWithAmount
  feeAsset?: TCurrencyInput
  // Used when there is an asset swap on some hop
  swapConfig?: {
    currencyTo: TCurrencyCore
    exchangeChain: TNodePolkadotKusama
  }
}

export type TDryRunOptions<TApi, TRes> = WithApi<TDryRunBaseOptions<TRes>, TApi, TRes>

export type TDryRunCallBaseOptions<TRes> = {
  /**
   * The transaction to dry-run
   */
  tx: TRes
  /**
   * The node to dry-run on
   */
  node: TNodeDotKsmWithRelayChains
  /**
   * The address to dry-run with
   */
  address: string
  feeAsset?: TAsset
}

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
   * The node to dry-run on
   */
  node: TNodeDotKsmWithRelayChains
  /**
   * The origin node
   */
  origin: TNodeDotKsmWithRelayChains
  asset: TAsset | null
  feeAsset?: TAsset
  amount: bigint
  originFee: bigint
}

export type TDryRunXcmOptions<TApi, TRes> = WithApi<TDryRunXcmBaseOptions, TApi, TRes>

export type TDryRunNodeSuccess = {
  success: true
  fee: bigint
  weight?: TWeight
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  forwardedXcms: any
  destParaId?: number
}

export type TDryRunNodeFailure = {
  success: false
  failureReason: string
}

export type TDryRunNodeResultInternal = TDryRunNodeSuccess | TDryRunNodeFailure

export type TDryRunNodeResult = (TDryRunNodeSuccess & { currency: string }) | TDryRunNodeFailure

export type THopInfo = {
  chain: TNodeWithRelayChains
  result: TDryRunNodeResultInternal & { currency?: string }
}

export type TDryRunChain =
  | 'origin'
  | 'destination'
  | 'assetHub'
  | 'bridgeHub'
  | TNodeWithRelayChains

export type TDryRunResult = {
  failureReason?: string
  failureChain?: TDryRunChain
  origin: TDryRunNodeResult
  destination?: TDryRunNodeResult
  assetHub?: TDryRunNodeResult
  bridgeHub?: TDryRunNodeResult
  hops: THopInfo[]
}

// XCM hop traversal types

export type HopProcessParams<TApi, TRes> = {
  api: IPolkadotApi<TApi, TRes>
  currentChain: TNodeDotKsmWithRelayChains
  currentOrigin: TNodeDotKsmWithRelayChains
  currentAsset: TAsset
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  forwardedXcms: any
  hasPassedExchange: boolean
  isDestination: boolean
  isAssetHub: boolean
  isBridgeHub: boolean
}

export type HopTraversalConfig<TApi, TRes, THopResult> = {
  api: IPolkadotApi<TApi, TRes>
  origin: TNodeDotKsmWithRelayChains
  destination: TNodeWithRelayChains
  currency: TCurrencyCore
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  initialForwardedXcms: any
  initialDestParaId: number | undefined
  swapConfig?: {
    exchangeChain: TNodeDotKsmWithRelayChains
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
    chain: TNodeDotKsmWithRelayChains
    result: THopResult
  }>
  assetHub?: THopResult
  bridgeHub?: THopResult
  destination?: THopResult
  lastProcessedChain?: TNodeDotKsmWithRelayChains
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
  LocalExecutionIncomplete = 'LocalExecutionIncomplete'
}

export type TModuleError = {
  index: string
  error: string
}
