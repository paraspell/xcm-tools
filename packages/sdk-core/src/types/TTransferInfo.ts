import type { TCurrencyCore, WithAmount } from '@paraspell/assets'
import type { TNodeDotKsmWithRelayChains, TNodeWithRelayChains } from '@paraspell/sdk-common'

import type { WithApi } from './TApi'

export type TTransferInfo = {
  chain: { origin: TNodeWithRelayChains; destination: TNodeWithRelayChains; ecosystem: string }
  currencyBalanceOrigin: {
    balance: bigint
    currency: string
  }
  originFeeBalance: {
    balance: bigint
    // balance - (xcmFee+10%)
    expectedBalanceAfterXCMFee: bigint
    xcmFee: {
      sufficientForXCM: boolean
      xcmFee: bigint
    }
    existentialDeposit: bigint
    asset: string
    minNativeTransferableAmount: bigint
    maxNativeTransferableAmount: bigint
  }
  destinationFeeBalance: {
    balance: bigint
    currency: string
    existentialDeposit: bigint
  }
}

export type TOriginFeeDetails = {
  sufficientForXCM: boolean
  xcmFee: bigint
}

export type TGetTransferInfoOptionsBase = {
  origin: TNodeDotKsmWithRelayChains
  destination: TNodeDotKsmWithRelayChains
  accountOrigin: string
  accountDestination: string
  currency: WithAmount<TCurrencyCore>
}

export type TGetTransferInfoOptions<TApi, TRes> = WithApi<TGetTransferInfoOptionsBase, TApi, TRes>
