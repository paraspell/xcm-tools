import type { TNodeDotKsmWithRelayChains } from '@paraspell/sdk-common'

import type { WithApi } from './TApi'
import type { TWeight } from './TTransfer'

export type TDryRunBaseOptions<TRes> = {
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
}

export type TDryRunOptions<TApi, TRes> = WithApi<TDryRunBaseOptions<TRes>, TApi, TRes>

export type TDryRunResult =
  | {
      success: true
      fee: bigint
      weight?: TWeight
    }
  | {
      success: false
      failureReason: string
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
