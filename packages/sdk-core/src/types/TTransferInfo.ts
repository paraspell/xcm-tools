import type { TCurrencyCore, WithAmount } from '@paraspell/assets'
import type { TNodeDotKsmWithRelayChains, TNodeWithRelayChains } from '@paraspell/sdk-common'

import type { UnableToComputeError } from '../errors'
import type { WithApi } from './TApi'

export type THopTransferInfo = {
  chain: TNodeWithRelayChains
  result: {
    xcmFee: TXcmFeeBase
    balance?: bigint
    existentialDeposit?: bigint
    currencySymbol: string
  }
}

export type TXcmFeeBase = {
  fee: bigint
  balance: bigint
  currencySymbol: string
}

export type TTransferInfo = {
  chain: { origin: TNodeWithRelayChains; destination: TNodeWithRelayChains; ecosystem: string }
  origin: {
    selectedCurrency: {
      sufficient: boolean
      balance: bigint
      balanceAfter: bigint
      currencySymbol: string
      existentialDeposit: bigint
    }
    xcmFee: TXcmFeeBase & {
      sufficient: boolean
      balanceAfter: bigint
    }
  }
  assetHub?: {
    balance: bigint
    currencySymbol: string
    existentialDeposit: bigint
    xcmFee: TXcmFeeBase
  }
  bridgeHub?: {
    currencySymbol: string
    xcmFee: TXcmFeeBase
  }
  hops?: THopTransferInfo[]
  destination: {
    receivedCurrency: {
      sufficient: boolean | UnableToComputeError
      receivedAmount: bigint | UnableToComputeError
      balance: bigint
      balanceAfter: bigint | UnableToComputeError
      currencySymbol: string
      existentialDeposit: bigint
    }
    xcmFee: TXcmFeeBase & {
      balanceAfter: bigint | UnableToComputeError
    }
  }
}

export type TOriginFeeDetails = {
  sufficientForXCM: boolean
  xcmFee: bigint
}

export type TGetTransferInfoOptionsBase<TRes> = {
  tx: TRes
  origin: TNodeDotKsmWithRelayChains
  destination: TNodeWithRelayChains
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
