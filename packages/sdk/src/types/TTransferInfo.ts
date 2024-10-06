import type { TNodeWithRelayChains } from './TNode'

export interface TTransferInfo {
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
