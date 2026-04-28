import type { TAssetInfo, TCurrencyCore, WithAmount } from '@paraspell/assets'
import type { TChain, TSubstrateChain, Version } from '@paraspell/sdk-common'

import type { PolkadotApi } from '../api'
import type { UnableToComputeError } from '../errors'
import type { WithApi } from './TApi'
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
    isExchange?: boolean
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
    isExchange?: boolean
  }
}

export type TBuildOriginInfoOptions<TApi, TRes, TSigner> = {
  api: PolkadotApi<TApi, TRes, TSigner>
  origin: TSubstrateChain
  sender: string
  currency: TCurrencyCore
  originAsset: TAssetInfo
  amount: bigint
  originFee: bigint
  originFeeAsset: TAssetInfo
  isFeeAssetAh: boolean
}

export type BuildHopInfoOptions<TApi, TRes, TSigner> = {
  api: PolkadotApi<TApi, TRes, TSigner>
  chain: TChain
  fee: bigint
  originChain: TSubstrateChain
  currency: TCurrencyCore
  asset: TAssetInfo
  sender: string
  ahAddress?: string
}

export type TBuildDestInfoOptions<TApi, TRes, TSigner> = {
  api: PolkadotApi<TApi, TRes, TSigner>
  origin: TSubstrateChain
  destination: TChain
  recipient: string
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
  sender: string
  ahAddress?: string
  recipient: string
  currency: WithAmount<TCurrencyCore>
  version: Version | undefined
  feeAsset?: TCurrencyCore
}

export type TGetTransferInfoOptions<TApi, TRes, TSigner> = WithApi<
  TGetTransferInfoOptionsBase<TRes>,
  TApi,
  TRes,
  TSigner
>
