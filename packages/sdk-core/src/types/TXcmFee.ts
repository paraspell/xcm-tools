/* eslint-disable @typescript-eslint/no-explicit-any */
import type { TAssetInfo, TCurrencyCore, TCurrencyInput, WithAmount } from '@paraspell/assets'
import type { TChain, TParachain, TSubstrateChain } from '@paraspell/sdk-common'

import type { WithApi } from './TApi'
import type { TTxPair, TWeight } from './TTransfer'

export type TGetXcmFeeBaseOptions<TRes, TDisableFallback extends boolean = boolean> = {
  /**
   * The transactions
   */
  txs: TTxPair<TRes>
  /**
   * The origin chain
   */
  origin: TSubstrateChain
  /**
   * The destination chain
   */
  destination: TChain
  /**
   * The sender address
   */
  senderAddress: string
  address: string
  currency: WithAmount<TCurrencyCore>
  feeAsset?: TCurrencyInput
  disableFallback: TDisableFallback
  // Used when there is an asset swap on some hop
  swapConfig?: TSwapConfig
}

export type TGetXcmFeeOptions<TApi, TRes, TDisableFallback extends boolean = boolean> = WithApi<
  TGetXcmFeeBaseOptions<TRes, TDisableFallback>,
  TApi,
  TRes
>

export type TGetXcmFeeInternalOptions<
  TApi,
  TRes,
  TDisableFallback extends boolean = boolean
> = Omit<TGetXcmFeeOptions<TApi, TRes, TDisableFallback>, 'txs'> & {
  tx: TRes
  useRootOrigin: boolean
}

export type TGetXcmFeeEstimateOptions<TApi, TRes> = Omit<
  TGetXcmFeeInternalOptions<TApi, TRes>,
  'disableFallback' | 'useRootOrigin'
>

export type TGetOriginXcmFeeEstimateOptions<TApi, TRes> = Omit<
  TGetXcmFeeInternalOptions<TApi, TRes>,
  'disableFallback' | 'address' | 'useRootOrigin'
>

export type TGetXcmFeeBuilderOptions = {
  disableFallback: boolean
}

export type TGetOriginXcmFeeBaseOptions<TRes> = {
  txs: {
    tx: TRes
    txBypass: TRes
  }
  origin: TSubstrateChain
  destination: TChain
  senderAddress: string
  currency: WithAmount<TCurrencyCore>
  feeAsset?: TCurrencyInput
  disableFallback: boolean
  useRootOrigin?: boolean
}

export type TGetOriginXcmFeeOptions<TApi, TRes> = WithApi<
  TGetOriginXcmFeeBaseOptions<TRes>,
  TApi,
  TRes
>

export type TGetOriginXcmFeeInternalOptions<TApi, TRes> = Omit<
  TGetOriginXcmFeeOptions<TApi, TRes>,
  'txs'
> & {
  tx: TRes
}

export type TSwapConfig = {
  currencyTo: TCurrencyCore
  exchangeChain: TParachain
}

export type TGetFeeForDestChainBaseOptions<TRes> = {
  prevChain: TSubstrateChain
  origin: TSubstrateChain
  destination: TChain
  senderAddress: string
  address: string
  currency: WithAmount<TCurrencyCore>
  forwardedXcms: any
  tx: TRes
  asset: TAssetInfo
  originFee: bigint
  feeAsset?: TCurrencyInput
  disableFallback: boolean
  swapConfig?: TSwapConfig
}

export type TGetFeeForDestChainOptions<TApi, TRes> = WithApi<
  TGetFeeForDestChainBaseOptions<TRes>,
  TApi,
  TRes
>

export type TGetReverseTxFeeOptions<TApi, TRes> = Omit<
  TGetFeeForDestChainOptions<TApi, TRes>,
  'destination' | 'disableFallback' | 'forwardedXcms' | 'asset' | 'originFee' | 'prevChain'
> & {
  destination: TSubstrateChain
}

export type THubKey = 'assetHub' | 'bridgeHub'

export type TFeeType = 'dryRun' | 'paymentInfo' | 'noFeeRequired'

type TXcmFeeBase = {
  /** @deprecated Use `asset` property instead. */
  currency: string
  asset: TAssetInfo
  weight?: TWeight
  sufficient?: boolean
}

export type TXcmFeeDetailSuccess = TXcmFeeBase & {
  fee: bigint
  feeType: TFeeType
  dryRunError?: string
}

export type TXcmFeeDetailWithFallback = TXcmFeeDetailSuccess

export type TXcmFeeDetailError = TXcmFeeBase & {
  fee?: bigint
  feeType?: TFeeType
  dryRunError: string
}

export type TXcmFeeDetail = TXcmFeeDetailSuccess | TXcmFeeDetailError

export type TXcmFeeHopResult = {
  fee?: bigint
  feeType?: TFeeType
  sufficient?: boolean
  dryRunError?: string
  forwardedXcms?: any
  destParaId?: number
  /** @deprecated Use `asset` property instead. */
  currency: string
  asset: TAssetInfo
}

export type TConditionalXcmFeeDetail<TDisableFallback extends boolean> =
  TDisableFallback extends false ? TXcmFeeDetailWithFallback : TXcmFeeDetail

export type TDestXcmFeeDetail<TDisableFallback extends boolean> = Omit<
  TConditionalXcmFeeDetail<TDisableFallback>,
  'currency'
> & {
  forwardedXcms?: any
  destParaId?: number
}

export type TConditionalXcmFeeHopInfo<TDisableFallback extends boolean> = {
  chain: TChain
  result: TConditionalXcmFeeDetail<TDisableFallback>
}

export type TXcmFeeChain = 'origin' | 'destination' | 'assetHub' | 'bridgeHub' | TChain

export type TXcmFeeHopInfo = {
  chain: TChain
  result: TXcmFeeDetail
}

export type TGetXcmFeeResult<TDisableFallback extends boolean = boolean> = {
  failureReason?: string
  failureChain?: TXcmFeeChain
  origin: TConditionalXcmFeeDetail<TDisableFallback>
  destination: TConditionalXcmFeeDetail<TDisableFallback>
  assetHub?: TConditionalXcmFeeDetail<TDisableFallback>
  bridgeHub?: TConditionalXcmFeeDetail<TDisableFallback>
  hops: TConditionalXcmFeeHopInfo<TDisableFallback>[]
}

export type TGetXcmFeeEstimateDetail = {
  fee: bigint
  /** @deprecated Use `asset` property instead. */
  currency: string
  asset: TAssetInfo
  sufficient?: boolean
}

export type TGetXcmFeeEstimateResult = {
  origin: TGetXcmFeeEstimateDetail
  destination: TGetXcmFeeEstimateDetail
}
