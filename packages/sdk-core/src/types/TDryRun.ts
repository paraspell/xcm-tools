import type { TAsset, TCurrencyInput, TCurrencyInputWithAmount } from '@paraspell/assets'
import type { TNodeDotKsmWithRelayChains, TNodeWithRelayChains } from '@paraspell/sdk-common'

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
  asset: TAsset
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

export type TDryRunChain = 'origin' | 'destination' | 'assetHub' | 'bridgeHub'

export type TDryRunResult = {
  failureReason?: string
  failureChain?: TDryRunChain
  origin: TDryRunNodeResult
  destination?: TDryRunNodeResult
  assetHub?: TDryRunNodeResult
  bridgeHub?: TDryRunNodeResult
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
