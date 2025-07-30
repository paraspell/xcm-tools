import type {
  TAssetInfo,
  TCurrencyCore,
  TCurrencyInput,
  TCurrencyInputWithAmount
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
  feeAsset?: TAssetInfo
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
   * The chain to dry-run on
   */
  chain: TSubstrateChain
  /**
   * The origin chain
   */
  origin: TSubstrateChain
  asset: TAssetInfo | null
  feeAsset?: TAssetInfo
  amount: bigint
  originFee: bigint
}

export type TDryRunXcmOptions<TApi, TRes> = WithApi<TDryRunXcmBaseOptions, TApi, TRes>

export type TDryRunChainSuccess = {
  success: true
  fee: bigint
  weight?: TWeight
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  forwardedXcms: any
  destParaId?: number
}

export type TDryRunChainFailure = {
  success: false
  failureReason: string
}

export type TDryRunChainResultInternal = TDryRunChainSuccess | TDryRunChainFailure

export type TDryRunChainResult = (TDryRunChainSuccess & { currency: string }) | TDryRunChainFailure

export type THopInfo = {
  chain: TChain
  result: TDryRunChainResultInternal & { currency?: string }
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
