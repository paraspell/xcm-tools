import type { TCurrencyCore, WithAmount } from '@paraspell/assets'
import type { TNodeDotKsmWithRelayChains, TNodeWithRelayChains } from '@paraspell/sdk-common'

import type { UnableToComputeError } from '../errors'
import type { WithApi } from './TApi'

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
    xcmFee: {
      sufficient: boolean
      fee: bigint
      balance: bigint
      balanceAfter: bigint
      currencySymbol: string
    }
  }
  destination: {
    receivedCurrency: {
      sufficient: boolean | UnableToComputeError
      balance: bigint
      balanceAfter: bigint | UnableToComputeError
      currencySymbol: string
      existentialDeposit: bigint
    }
    xcmFee: {
      fee: bigint
      balance: bigint
      balanceAfter: bigint
      currencySymbol: string
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
  destination: TNodeDotKsmWithRelayChains
  senderAddress: string
  address: string
  currency: WithAmount<TCurrencyCore>
}

export type TGetTransferInfoOptions<TApi, TRes> = WithApi<
  TGetTransferInfoOptionsBase<TRes>,
  TApi,
  TRes
>
