import type { TCurrencyCore } from '@paraspell/assets'
import type { TChain, TSubstrateChain } from '@paraspell/sdk-common'

import type { EXCHANGE_CHAINS } from '../constants'

export type TExchangeChain = (typeof EXCHANGE_CHAINS)[number]

export type TExchangeInput = TExchangeChain | [TExchangeChain, ...TExchangeChain[]] | undefined

export type TSwapOptions<TApi, TRes, TSigner> = {
  currencyTo: TCurrencyCore
  exchange?: TExchangeInput
  slippage?: number
  evmSenderAddress?: string
  evmSigner?: TSigner
  onStatusChange?: TStatusChangeCallback<TApi, TRes>
}

export type TTransactionContext<TApi, TRes> = {
  type: TTransactionType
  api: TApi
  chain: TSubstrateChain
  tx: TRes
}

export type TTransactionType = 'TRANSFER' | 'SWAP' | 'SWAP_AND_TRANSFER'

export type TSwapEventType = TTransactionType | 'SELECTING_EXCHANGE' | 'COMPLETED'

/**
 * The transaction progress information.
 */
export type TSwapEvent<TApi, TRes> = {
  /**
   * Current execution phase type
   */
  type: TSwapEventType
  /**
   * Full transaction plan for visualization
   */
  routerPlan?: TTransactionContext<TApi, TRes>[]
  /**
   * Current transaction's origin chain
   */
  chain?: TSubstrateChain
  /**
   * Current transaction's destination chain
   */
  destinationChain?: TChain
  /**
   * 0-based step index of current operation
   */
  currentStep?: number
}

export type TStatusChangeCallback<TApi, TRes> = (info: TSwapEvent<TApi, TRes>) => void
