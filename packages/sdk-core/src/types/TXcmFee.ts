/* eslint-disable @typescript-eslint/no-explicit-any */
import type {
  TAssetInfo,
  TCurrencyInput,
  TCurrencyInputWithAmount,
  WithAmount
} from '@paraspell/assets'
import type { TChain, TSubstrateChain, Version } from '@paraspell/sdk-common'

import type { WithApi } from './TApi'
import type { TChainEndpoint, TSwapConfig } from './TDryRun'
import type { TWeight } from './TTransfer'

export type TXcmFeeSwapConfig = TSwapConfig & { amountOut: bigint }

export type TTxFactory<TRes> = (amount?: string, relative?: boolean) => Promise<TRes>

export type TGetXcmFeeBaseOptions<
  TRes,
  TDisableFallback extends boolean = boolean,
  TCustomChain extends string = never
> = {
  /**
   * The transaction factory
   */
  buildTx: TTxFactory<TRes>
  /**
   * The origin chain
   */
  origin: TSubstrateChain | TCustomChain
  /**
   * The destination chain
   */
  destination: TChain
  /**
   * The sender address
   */
  sender: string
  recipient: string
  currency: TCurrencyInputWithAmount
  version?: Version
  feeAsset?: TCurrencyInput
  disableFallback: TDisableFallback
  // Used when there is an asset swap on some hop
  swapConfig?: TXcmFeeSwapConfig
  skipReverseFeeCalculation?: boolean
}

export type TGetXcmFeeOptions<
  TApi,
  TRes,
  TSigner,
  TDisableFallback extends boolean = boolean,
  TCustomChain extends string = never
> = WithApi<
  TGetXcmFeeBaseOptions<TRes, TDisableFallback, TCustomChain>,
  TApi,
  TRes,
  TSigner,
  TCustomChain
>

export type TGetXcmFeeInternalOptions<
  TApi,
  TRes,
  TSigner,
  TDisableFallback extends boolean = boolean,
  TCustomChain extends string = never
> = Omit<TGetXcmFeeOptions<TApi, TRes, TSigner, TDisableFallback, TCustomChain>, 'buildTx'> & {
  tx: TRes
  useRootOrigin: boolean
}

export type TGetXcmFeeBuilderOptions = {
  disableFallback: boolean
}

export type TGetOriginXcmFeeBaseOptions<
  TRes,
  TDisableFallback extends boolean = boolean,
  TCustomChain extends string = never
> = {
  buildTx: TTxFactory<TRes>
  origin: TSubstrateChain | TCustomChain
  destination: TChain
  sender: string
  currency: TCurrencyInputWithAmount
  version?: Version
  feeAsset?: TCurrencyInput
  disableFallback: TDisableFallback
  useRootOrigin?: boolean
}

export type TGetOriginXcmFeeOptions<
  TApi,
  TRes,
  TSigner,
  TDisableFallback extends boolean = boolean,
  TCustomChain extends string = never
> = WithApi<
  TGetOriginXcmFeeBaseOptions<TRes, TDisableFallback, TCustomChain>,
  TApi,
  TRes,
  TSigner,
  TCustomChain
>

export type TGetOriginXcmFeeInternalOptions<
  TApi,
  TRes,
  TSigner,
  TCustomChain extends string = never
> = Omit<TGetOriginXcmFeeOptions<TApi, TRes, TSigner, boolean, TCustomChain>, 'buildTx'> & {
  tx: TRes
}

export type TGetFeeForDestChainBaseOptions<TRes, TCustomChain extends string = never> = {
  prevChain: TSubstrateChain | TCustomChain
  origin: TSubstrateChain | TCustomChain
  destination: TChain
  sender: string
  recipient: string
  currency: TCurrencyInputWithAmount
  asset: WithAmount<TAssetInfo>
  currentAsset: WithAmount<TAssetInfo>
  forwardedXcms: any
  tx: TRes
  version: Version
  originFee: bigint
  feeAsset?: TCurrencyInput
  disableFallback: boolean
  hasPassedExchange?: boolean
  swapConfig?: TXcmFeeSwapConfig
  skipReverseFeeCalculation?: boolean
}

export type TGetFeeForDestChainOptions<
  TApi,
  TRes,
  TSigner,
  TCustomChain extends string = never
> = WithApi<TGetFeeForDestChainBaseOptions<TRes, TCustomChain>, TApi, TRes, TSigner, TCustomChain>

export type TGetReverseTxFeeOptions<
  TApi,
  TRes,
  TSigner,
  TCustomChain extends string = never
> = Omit<
  TGetFeeForDestChainOptions<TApi, TRes, TSigner, TCustomChain>,
  | 'destination'
  | 'disableFallback'
  | 'forwardedXcms'
  | 'asset'
  | 'originFee'
  | 'prevChain'
  | 'version'
> & {
  destination: TSubstrateChain
}

export type TFeeType = 'dryRun' | 'paymentInfo' | 'noFeeRequired'

type TXcmFeeBase = {
  asset: TAssetInfo
  weight?: TWeight
  sufficient?: boolean
  isExchange?: boolean
}

export type TXcmFeeDetailSuccess = TXcmFeeBase & {
  fee: bigint
  feeType: TFeeType
  dryRunError?: string
  dryRunSubError?: string
  dryRunErrorIndex?: number
  dryRunErrorInstruction?: object
}

export type TXcmFeeDetailWithFallback = TXcmFeeDetailSuccess

export type TXcmFeeDetailError = TXcmFeeBase & {
  fee?: bigint
  feeType?: TFeeType
  dryRunError: string
  dryRunSubError?: string
  dryRunErrorIndex?: number
  dryRunErrorInstruction?: object
}

export type TXcmFeeDetail = TXcmFeeDetailSuccess | TXcmFeeDetailError

export type TXcmFeeHopResult = {
  fee?: bigint
  feeType?: TFeeType
  sufficient?: boolean
  dryRunError?: string
  dryRunSubError?: string
  dryRunErrorIndex?: number
  dryRunErrorInstruction?: object
  forwardedXcms?: any
  destParaId?: number
  asset: TAssetInfo
}

export type TConditionalXcmFeeDetail<TDisableFallback extends boolean> =
  TDisableFallback extends false ? TXcmFeeDetailWithFallback : TXcmFeeDetail

export type TXcmFeeDetailWithForwardedXcm<TDisableFallback extends boolean> =
  TConditionalXcmFeeDetail<TDisableFallback> & {
    forwardedXcms?: unknown
    destParaId?: number
  }

export type TConditionalXcmFeeHopInfo<TDisableFallback extends boolean> = {
  chain: TChain
  result: TConditionalXcmFeeDetail<TDisableFallback>
}

export type TXcmFeeHopInfo = {
  chain: TChain
  result: TXcmFeeDetail
}

export type TGetXcmFeeResult<TDisableFallback extends boolean = boolean> = {
  failureReason?: string
  failureIndex?: number
  failureInstruction?: object
  failureChain?: TChainEndpoint
  origin: TConditionalXcmFeeDetail<TDisableFallback>
  destination: TConditionalXcmFeeDetail<TDisableFallback>
  hops: TConditionalXcmFeeHopInfo<TDisableFallback>[]
}

export type TPaymentInfo = {
  partialFee: bigint
  weight: TWeight
}
