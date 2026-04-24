import type { TAmount, TCurrencyCore, TCurrencyInput } from '@paraspell/assets'
import type { TChain, TSubstrateChain } from '@paraspell/sdk-common'

import type { PolkadotApi } from '../api'
import type { EXCHANGE_CHAINS } from '../constants'
import type { TDryRunResult } from './TDryRun'
import type { TGetXcmFeeBuilderOptions, TGetXcmFeeResult } from './TXcmFee'

export type TExchangeChain = (typeof EXCHANGE_CHAINS)[number]

export type TExchangeInput = TExchangeChain | TExchangeChain[] | undefined

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

export interface TSwapBuilder<TApi, TRes, TSigner> {
  from(chain: TSubstrateChain | undefined): TSwapBuilder<TApi, TRes, TSigner>
  to(chain: TChain | undefined): TSwapBuilder<TApi, TRes, TSigner>
  exchange(chain: TExchangeInput): TSwapBuilder<TApi, TRes, TSigner>
  currencyFrom(currency: TCurrencyInput): TSwapBuilder<TApi, TRes, TSigner>
  currencyTo(currency: TCurrencyInput): TSwapBuilder<TApi, TRes, TSigner>
  feeAsset(currency: TCurrencyInput | undefined): TSwapBuilder<TApi, TRes, TSigner>
  amount(amount: TAmount): TSwapBuilder<TApi, TRes, TSigner>
  recipient(address: string | undefined): TSwapBuilder<TApi, TRes, TSigner>
  sender(address: string): TSwapBuilder<TApi, TRes, TSigner>
  signer(signer: TSigner): TSwapBuilder<TApi, TRes, TSigner>
  evmSenderAddress(address: string | undefined): TSwapBuilder<TApi, TRes, TSigner>
  evmSigner(signer: TSigner | undefined): TSwapBuilder<TApi, TRes, TSigner>
  slippagePct(pct: string): TSwapBuilder<TApi, TRes, TSigner>
  onStatusChange(callback: TStatusChangeCallback<TApi, TRes>): TSwapBuilder<TApi, TRes, TSigner>

  getXcmFees<TDisableFallback extends boolean = false>(
    options?: TGetXcmFeeBuilderOptions & { disableFallback: TDisableFallback }
  ): Promise<TGetXcmFeeResult<TDisableFallback>>
  getTransferableAmount(): Promise<bigint>
  getMinTransferableAmount(): Promise<bigint>
  getBestAmountOut(): Promise<{ exchange: TExchangeChain; amountOut: bigint }>
  dryRun(): Promise<TDryRunResult>
  build(): Promise<TTransactionContext<TApi, TRes>[]>
  signAndSubmit(): Promise<string[]>
}

export type TSwapBuilderFactory = <TApi, TRes, TSigner>(
  api: PolkadotApi<TApi, TRes, TSigner>
) => TSwapBuilder<TApi, TRes, TSigner>
