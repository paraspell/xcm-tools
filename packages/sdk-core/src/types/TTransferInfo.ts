import type { TAssetInfo, TCurrencyCore, WithAmount } from '@paraspell/assets'
import type { TChain, TSubstrateChain } from '@paraspell/sdk-common'

import type { IPolkadotApi } from '../api'
import type { UnableToComputeError } from '../errors'
import type { WithApi } from './TApi'
import type { TXcmFeeDetail } from './TXcmFee'

export type THopTransferInfo = {
  chain: TChain
  result: {
    xcmFee: TXcmFeeBase
    balance?: bigint
    existentialDeposit?: bigint
    /** @deprecated use `asset` property instead */
    currencySymbol: string
    asset: TAssetInfo
  }
}

export type TXcmFeeBase = {
  fee: bigint
  balance: bigint
  /** @deprecated use `asset` property instead */
  currencySymbol: string
  asset: TAssetInfo
}

export type TTransferInfo = {
  chain: { origin: TChain; destination: TChain; ecosystem: string }
  origin: {
    selectedCurrency: {
      sufficient: boolean
      balance: bigint
      balanceAfter: bigint
      /** @deprecated use `asset` property instead */
      currencySymbol: string
      asset: TAssetInfo
      existentialDeposit: bigint
    }
    xcmFee: TXcmFeeBase & {
      sufficient: boolean
      balanceAfter: bigint
    }
  }
  assetHub?: {
    balance: bigint
    /** @deprecated use `asset` property instead */
    currencySymbol: string
    asset: TAssetInfo
    existentialDeposit: bigint
    xcmFee: TXcmFeeBase
  }
  bridgeHub?: {
    /** @deprecated use `asset` property instead */
    currencySymbol: string
    asset: TAssetInfo
    xcmFee: TXcmFeeBase
  }
  hops?: THopTransferInfo[]
  destination: {
    receivedCurrency: {
      sufficient: boolean | UnableToComputeError
      receivedAmount: bigint | UnableToComputeError
      balance: bigint
      balanceAfter: bigint | UnableToComputeError
      /** @deprecated use `asset` property instead */
      currencySymbol: string
      asset: TAssetInfo
      existentialDeposit: bigint
    }
    xcmFee: TXcmFeeBase & {
      balanceAfter: bigint | UnableToComputeError
    }
  }
}

export type BuildHopInfoOptions<TApi, TRes> = {
  api: IPolkadotApi<TApi, TRes>
  chain: TSubstrateChain
  feeData: {
    fee: bigint
    currency: string
  }
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
  assetHubFee?: bigint
  bridgeFee?: bigint
}

export type TOriginFeeDetails = {
  sufficientForXCM: boolean
  xcmFee: bigint
}

export type TGetTransferInfoOptionsBase<TRes> = {
  tx: TRes
  origin: TSubstrateChain
  destination: TChain
  senderAddress: string
  ahAddress?: string
  address: string
  currency: WithAmount<TCurrencyCore>
  feeAsset?: TCurrencyCore
}

export type TGetTransferInfoOptions<TApi, TRes> = WithApi<
  TGetTransferInfoOptionsBase<TRes>,
  TApi,
  TRes
>
