import type { TAssetInfo, TCurrencyCore, WithAmount } from '@paraspell/assets'
import type { TChain, TSubstrateChain, Version } from '@paraspell/sdk-common'

import type { IPolkadotApi } from '../api'
import type { UnableToComputeError } from '../errors'
import type { WithApi } from './TApi'
import type { TTxFactory, TXcmFeeDetail } from './TXcmFee'

export type THopTransferInfo = {
  chain: TChain
  result: {
    xcmFee: TXcmFeeBase
    asset: TAssetInfo
  }
}

export type TXcmFeeBase = {
  fee: bigint
  asset: TAssetInfo
}

export type TTransferInfo = {
  chain: { origin: TChain; destination: TChain; ecosystem: string }
  origin: {
    selectedCurrency: {
      sufficient: boolean
      balance: bigint
      balanceAfter: bigint
      asset: TAssetInfo
    }
    xcmFee: TXcmFeeBase & {
      sufficient: boolean
      balance: bigint
      balanceAfter: bigint
    }
  }
  hops: THopTransferInfo[]
  destination: {
    receivedCurrency: {
      sufficient: boolean | UnableToComputeError
      receivedAmount: bigint | UnableToComputeError
      balance: bigint
      balanceAfter: bigint | UnableToComputeError
      asset: TAssetInfo
    }
    xcmFee: TXcmFeeBase & {
      balanceAfter: bigint | UnableToComputeError
    }
  }
}

export type BuildHopInfoOptions<TApi, TRes> = {
  api: IPolkadotApi<TApi, TRes>
  chain: TSubstrateChain
  fee: bigint
  originChain: TSubstrateChain
  currency: TCurrencyCore
  asset: TAssetInfo
  senderAddress: string
  ahAddress?: string
}

export type TBuildDestInfoOptions<TApi, TRes> = {
  api: IPolkadotApi<TApi, TRes>
  origin: TSubstrateChain
  destination: TChain
  address: string
  currency: WithAmount<TCurrencyCore>
  originFee: bigint
  isFeeAssetAh: boolean
  destFeeDetail: TXcmFeeDetail
  totalHopFee: bigint
  bridgeFee?: bigint
}

export type TOriginFeeDetails = {
  sufficientForXCM: boolean
  xcmFee: bigint
}

export type TGetTransferInfoOptionsBase<TRes> = {
  buildTx: TTxFactory<TRes>
  origin: TSubstrateChain
  destination: TChain
  senderAddress: string
  ahAddress?: string
  address: string
  currency: WithAmount<TCurrencyCore>
  version: Version | undefined
  feeAsset?: TCurrencyCore
}

export type TGetTransferInfoOptions<TApi, TRes> = WithApi<
  TGetTransferInfoOptionsBase<TRes>,
  TApi,
  TRes
>
