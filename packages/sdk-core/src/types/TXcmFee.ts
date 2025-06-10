/* eslint-disable @typescript-eslint/no-explicit-any */
import type { TAsset, TCurrencyCore, TCurrencyInput, WithAmount } from '@paraspell/assets'
import type { TNodeDotKsmWithRelayChains, TNodeWithRelayChains } from '@paraspell/sdk-common'

import type { WithApi } from './TApi'
import type { TWeight } from './TTransfer'

export type TGetXcmFeeBaseOptions<TRes> = {
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
  disableFallback: boolean
}

export type TGetXcmFeeOptions<TApi, TRes> = WithApi<TGetXcmFeeBaseOptions<TRes>, TApi, TRes>

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
  currency: TCurrencyInput
  feeAsset?: TCurrencyInput
  disableFallback: boolean
}

export type TGetOriginXcmFeeOptions<TApi, TRes> = WithApi<
  TGetOriginXcmFeeBaseOptions<TRes>,
  TApi,
  TRes
>

export type TGetFeeForDestNodeBaseOptions = {
  prevNode: TNodeDotKsmWithRelayChains
  origin: TNodeDotKsmWithRelayChains
  destination: TNodeWithRelayChains
  senderAddress: string
  address: string
  currency: WithAmount<TCurrencyCore>
  forwardedXcms: any
  asset: TAsset
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

export type TXcmFeeChain = 'origin' | 'destination' | 'assetHub' | 'bridgeHub'

export type TGetXcmFeeResult = {
  failureReason?: string
  failureChain?: TXcmFeeChain
  origin: TXcmFeeDetail
  destination: TXcmFeeDetail
  assetHub?: TXcmFeeDetail
  bridgeHub?: TXcmFeeDetail
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
