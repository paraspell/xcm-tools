import type { TCurrencyCore } from '@paraspell/assets'
import type { TSubstrateChain } from '@paraspell/sdk-common'

import type { EXCHANGE_CHAINS } from '../constants'

export type TExchangeChain = (typeof EXCHANGE_CHAINS)[number]

export type TExchangeInput = TExchangeChain | [TExchangeChain, ...TExchangeChain[]] | undefined

export type TSwapOptions<TSigner> = {
  currencyTo: TCurrencyCore
  exchange: TExchangeInput
  slippage: number
  evmSenderAddress?: string
  evmSigner?: TSigner
}

export type TTransactionContext<TApi, TRes> = {
  api: TApi
  chain: TSubstrateChain
  tx: TRes
}
