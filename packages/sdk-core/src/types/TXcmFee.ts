/* eslint-disable @typescript-eslint/no-explicit-any */
import type { TCurrencyInputWithAmount } from '@paraspell/assets'
import type { TNodeDotKsmWithRelayChains } from '@paraspell/sdk-common'

import type { WithApi } from './TApi'

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
  destination: TNodeDotKsmWithRelayChains
  /**
   * The sender address
   */
  senderAddress: string
  address: string
  currency: TCurrencyInputWithAmount
  disableFallback: boolean
}

export type TGetXcmFeeOptions<TApi, TRes> = WithApi<TGetXcmFeeBaseOptions<TRes>, TApi, TRes>

export type TGetXcmFeeEstimateOptions<TApi, TRes> = Omit<
  TGetXcmFeeOptions<TApi, TRes>,
  'disableFallback'
>

export type TGetOriginXcmFeeEstimateOptions<TApi, TRes> = Omit<
  TGetXcmFeeOptions<TApi, TRes>,
  'disableFallback' | 'address' | 'currency'
>

export type TGetXcmFeeBuilderOptions = {
  disableFallback: boolean
}

export type TGetOriginXcmFeeBaseOptions<TRes> = {
  tx: TRes
  origin: TNodeDotKsmWithRelayChains
  destination: TNodeDotKsmWithRelayChains
  senderAddress: string
  disableFallback: boolean
}

export type TGetOriginXcmFeeOptions<TApi, TRes> = WithApi<
  TGetOriginXcmFeeBaseOptions<TRes>,
  TApi,
  TRes
>

export type TGetFeeForDestNodeBaseOptions = {
  origin: TNodeDotKsmWithRelayChains
  destination: TNodeDotKsmWithRelayChains
  senderAddress: string
  address: string
  currency: TCurrencyInputWithAmount
  forwardedXcms: any
  disableFallback: boolean
}

export type TGetFeeForDestNodeOptions<TApi, TRes> = WithApi<
  TGetFeeForDestNodeBaseOptions,
  TApi,
  TRes
>

export type THubKey = 'assetHub' | 'bridgeHub'

export type TFeeType = 'dryRun' | 'paymentInfo'

export type TXcmFeeDetail =
  | {
      fee: bigint
      currency: string
      feeType: TFeeType
      dryRunError?: string
    }
  | {
      fee?: bigint
      currency?: string
      feeType?: TFeeType
      dryRunError: string
    }

export type TGetXcmFeeResult = {
  origin: TXcmFeeDetail
  destination: TXcmFeeDetail
  assetHub?: TXcmFeeDetail
  bridgeHub?: TXcmFeeDetail
}

export type TGetXcmFeeEstimateDetail = {
  fee: bigint
  currency: string
}

export type TGetXcmFeeEstimateResult = {
  origin: TGetXcmFeeEstimateDetail
  destination: TGetXcmFeeEstimateDetail
}
