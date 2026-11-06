import type { TAssetInfo, TCurrencyCore, TSingleCurrencyInput, WithAmount } from '@paraspell/assets'
import type { TChain, TSubstrateChain, Version } from '@paraspell/sdk-common'

import type { PolkadotApi } from '../api'
import type { UnableToComputeError } from '../errors'
import type { WithApi } from './TApi'
import type { TPerAssetResult } from './TBalance'
import type { TTxFactory, TXcmFeeDetail } from './TXcmFee'

export type THopTransferInfo = {
  chain: TChain
  result: {
    xcmFee: TXcmFeeBase
    asset: TAssetInfo
    isExchange?: boolean
  }
}

export type TXcmFeeBase = {
  fee: bigint
  asset: TAssetInfo
}

export type TOriginXcmFeeInfo = TXcmFeeBase & {
  sufficient: boolean
  balance: bigint
  balanceAfter: bigint
}

export type TSelectedCurrencyInfo = {
  sufficient: boolean
  balance: bigint
  balanceAfter: bigint
  asset: TAssetInfo
}

export type TReceivedCurrencyInfo = {
  sufficient: boolean | UnableToComputeError
  receivedAmount: bigint | UnableToComputeError
  balance: bigint
  balanceAfter: bigint | UnableToComputeError
  asset: TAssetInfo
}

export type TTransferInfo<TCurrency = WithAmount<TCurrencyCore>> = {
  chain: { origin: TChain; destination: TChain; ecosystem: string }
  origin: {
    selectedCurrency: TPerAssetResult<TCurrency, TSelectedCurrencyInfo>
    xcmFee: TOriginXcmFeeInfo
    isExchange?: boolean
  }
  hops: THopTransferInfo[]
  destination: {
    receivedCurrency: TPerAssetResult<TCurrency, TReceivedCurrencyInfo>
    xcmFee: TXcmFeeBase & {
      balanceAfter: bigint | UnableToComputeError
    }
    isExchange?: boolean
  }
}

export type TBuildOriginInfoOptions<TApi, TRes, TSigner, TCustomChain extends string = never> = {
  api: PolkadotApi<TApi, TRes, TSigner, TCustomChain>
  origin: TSubstrateChain
  sender: string
  assets: WithAmount<TAssetInfo>[]
  amount: bigint
  originFee: bigint
  originFeeAsset: TAssetInfo
  isFeeAssetAh: boolean
}

export type BuildHopInfoOptions<TApi, TRes, TSigner, TCustomChain extends string = never> = {
  api: PolkadotApi<TApi, TRes, TSigner, TCustomChain>
  chain: TChain
  fee: bigint
  originChain: TSubstrateChain
  currency: TSingleCurrencyInput
  asset: TAssetInfo
  sender: string
  ahAddress?: string
}

export type TBuildDestInfoOptions<TApi, TRes, TSigner, TCustomChain extends string = never> = {
  api: PolkadotApi<TApi, TRes, TSigner, TCustomChain>
  origin: TSubstrateChain
  destination: TChain
  recipient: string
  currency: WithAmount<TSingleCurrencyInput>
  originFee: bigint
  isFeeAssetAh: boolean
  paysDestFee: boolean
  destFeeDetail: TXcmFeeDetail
  totalHopFee: bigint
  bridgeFee?: bigint
}

export type TOriginFeeDetails = {
  sufficientForXCM: boolean
  xcmFee: bigint
}

export type TGetTransferInfoOptionsBase<TRes, TCurrency = WithAmount<TCurrencyCore>> = {
  buildTx: TTxFactory<TRes>
  origin: TSubstrateChain
  destination: TChain
  sender: string
  ahAddress?: string
  recipient: string
  currency: TCurrency
  version: Version | undefined
  feeAsset?: TCurrencyCore
}

export type TGetTransferInfoOptions<
  TApi,
  TRes,
  TSigner,
  TCustomChain extends string = never,
  TCurrency = WithAmount<TCurrencyCore>
> = WithApi<TGetTransferInfoOptionsBase<TRes, TCurrency>, TApi, TRes, TSigner, TCustomChain>
