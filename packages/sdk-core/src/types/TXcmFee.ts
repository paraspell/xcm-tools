/* eslint-disable @typescript-eslint/no-explicit-any */
import type {
  TAssetInfo,
  TCurrencyCore,
  TCurrencyInput,
  WithAmount,
  WithComplexAmount
} from '@paraspell/assets'
import type {
  TNodeDotKsmWithRelayChains,
  TNodePolkadotKusama,
  TNodeWithRelayChains
} from '@paraspell/sdk-common'

import type { GeneralBuilder } from '../builder'
import type { WithApi } from './TApi'
import type { TSendBaseOptions, TWeight } from './TTransfer'

export type TGetXcmFeeBaseOptions<TRes, TDisableFallback extends boolean = boolean> = {
  /**
   * The transaction to calculate the fee for
   */
  tx: TRes
  /**
   * The origin node
   */
  origin: TNodeDotKsmWithRelayChains
  /**
   * The destination node
   */
  destination: TNodeWithRelayChains
  /**
   * The sender address
   */
  senderAddress: string
  address: string
  currency: WithAmount<TCurrencyCore>
  feeAsset?: TCurrencyInput
  disableFallback: TDisableFallback
  // Used when there is an asset swap on some hop
  swapConfig?: {
    currencyTo: TCurrencyCore
    exchangeChain: TNodePolkadotKusama
  }
}

export type TGetXcmFeeOptions<TApi, TRes, TDisableFallback extends boolean = boolean> = WithApi<
  TGetXcmFeeBaseOptions<TRes, TDisableFallback>,
  TApi,
  TRes
>

export type TGetXcmFeeEstimateOptions<TApi, TRes> = Omit<
  TGetXcmFeeOptions<TApi, TRes>,
  'disableFallback'
>

export type TGetOriginXcmFeeEstimateOptions<TApi, TRes> = Omit<
  TGetXcmFeeOptions<TApi, TRes>,
  'disableFallback' | 'address'
>

export type TGetXcmFeeBuilderOptions = {
  disableFallback: boolean
}

export type TGetOriginXcmFeeBaseOptions<TRes> = {
  tx: TRes
  origin: TNodeDotKsmWithRelayChains
  destination: TNodeWithRelayChains
  senderAddress: string
  currency: WithComplexAmount<TCurrencyCore>
  feeAsset?: TCurrencyInput
  disableFallback: boolean
}

export type TGetOriginXcmFeeOptions<TApi, TRes> = WithApi<
  TGetOriginXcmFeeBaseOptions<TRes>,
  TApi,
  TRes
>

export type TAttemptDryRunFeeOptions<TApi, TRes> = Omit<
  TGetOriginXcmFeeOptions<TApi, TRes>,
  'tx'
> & {
  builder: GeneralBuilder<TApi, TRes, TSendBaseOptions>
}

export type TGetFeeForDestNodeBaseOptions = {
  prevNode: TNodeDotKsmWithRelayChains
  origin: TNodeDotKsmWithRelayChains
  destination: TNodeWithRelayChains
  senderAddress: string
  address: string
  currency: WithAmount<TCurrencyCore>
  forwardedXcms: any
  asset: TAssetInfo
  originFee: bigint
  feeAsset?: TCurrencyInput
  disableFallback: boolean
}

export type TGetFeeForDestNodeOptions<TApi, TRes> = WithApi<
  TGetFeeForDestNodeBaseOptions,
  TApi,
  TRes
>

export type TGetReverseTxFeeOptions<TApi, TRes> = Omit<
  TGetFeeForDestNodeOptions<TApi, TRes>,
  'destination' | 'disableFallback' | 'forwardedXcms' | 'asset' | 'originFee' | 'prevNode'
> & {
  destination: TNodeDotKsmWithRelayChains
}

export type THubKey = 'assetHub' | 'bridgeHub'

export type TFeeType = 'dryRun' | 'paymentInfo' | 'noFeeRequired'

export type TXcmFeeDetailWithFallback = {
  fee: bigint
  currency: string
  feeType: TFeeType
  weight?: TWeight
  sufficient?: boolean
  dryRunError?: string
}

export type TXcmFeeDetail =
  | {
      fee: bigint
      currency: string
      feeType: TFeeType
      weight?: TWeight
      sufficient?: boolean
      dryRunError?: string
    }
  | {
      fee?: bigint
      currency?: string
      feeType?: TFeeType
      weight?: TWeight
      sufficient?: boolean
      dryRunError: string
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
  chain: TNodeWithRelayChains
  result: TConditionalXcmFeeDetail<TDisableFallback>
}

export type TXcmFeeChain =
  | 'origin'
  | 'destination'
  | 'assetHub'
  | 'bridgeHub'
  | TNodeWithRelayChains

export type TXcmFeeHopInfo = {
  chain: TNodeWithRelayChains
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
  currency: string
  sufficient?: boolean
}

export type TGetXcmFeeEstimateResult = {
  origin: TGetXcmFeeEstimateDetail
  destination: TGetXcmFeeEstimateDetail
}
