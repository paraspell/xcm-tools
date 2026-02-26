/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-redundant-type-constituents */
declare module '@paraspell/xcm-router' {
  import type {
    TBuilderConfig,
    TChain,
    TCurrencyInput,
    TDryRunChainResult,
    TDryRunResult,
    TExchangeChain,
    TExchangeInput,
    TGetXcmFeeResult,
    THopInfo,
    TSubstrateChain,
    TUrl
  } from '@paraspell/sdk-core'
  import type { PolkadotSigner } from 'polkadot-api'

  export type TRouterBuilderOptions = Omit<TBuilderConfig<TUrl>, 'xcmFormatCheck'>

  type TWithExchange<T> = T & { isExchange?: boolean }

  type TRouterDryRunChainResult = TWithExchange<TDryRunChainResult>
  type TRouterDryRunHopInfo = TWithExchange<THopInfo>

  export type TRouterDryRunResult = Omit<TDryRunResult, 'origin' | 'destination' | 'hops'> & {
    origin: TRouterDryRunChainResult
    destination?: TRouterDryRunChainResult
    hops: TRouterDryRunHopInfo[]
  }

  export type TGetBestAmountOutResult = {
    exchange: TExchangeChain
    amountOut: bigint
  }

  type TTransactionType = 'TRANSFER' | 'SWAP' | 'SWAP_AND_TRANSFER'

  interface TBaseTransaction {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    api: any
    chain: TSubstrateChain
    destinationChain?: TChain
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    tx: any
  }

  type TSwapTransaction = TBaseTransaction & { type: 'SWAP'; amountOut: bigint }
  type TTransferTransaction = TBaseTransaction & { type: 'TRANSFER' }
  type TSwapAndTransferTransaction = TBaseTransaction & {
    type: 'SWAP_AND_TRANSFER'
    amountOut: bigint
  }
  type TTransaction = TSwapTransaction | TSwapAndTransferTransaction | TTransferTransaction
  export type TRouterPlan = TTransaction[]

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export class RouterBuilderCore<T extends Record<string, any> = object> {
    from(chain: TSubstrateChain | undefined): RouterBuilderCore
    exchange(chain: TExchangeInput): RouterBuilderCore
    to(chain: TChain | undefined): RouterBuilderCore
    currencyFrom(currency: TCurrencyInput): RouterBuilderCore
    currencyTo(currency: TCurrencyInput): RouterBuilderCore
    feeAsset(currency: TCurrencyInput | undefined): RouterBuilderCore
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    amount(amount: any): RouterBuilderCore
    recipientAddress(address: string | undefined): RouterBuilderCore
    senderAddress(address: string): RouterBuilderCore
    signer(signer: PolkadotSigner): RouterBuilderCore
    evmSenderAddress(address: string | undefined): RouterBuilderCore
    evmSigner(signer: PolkadotSigner | undefined): RouterBuilderCore
    slippagePct(pct: string): RouterBuilderCore
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onStatusChange(callback: any): RouterBuilderCore
    getXcmFees<TDisableFallback extends boolean = false>(options?: {
      disableFallback: TDisableFallback
    }): Promise<TGetXcmFeeResult<TDisableFallback>>
    getTransferableAmount(): Promise<bigint>
    getMinTransferableAmount(): Promise<bigint>
    build(): Promise<void>
    buildTransactions(): Promise<TRouterPlan>
    dryRun(): Promise<TRouterDryRunResult>
    getBestAmountOut(): Promise<TGetBestAmountOutResult>
  }

  export function RouterBuilder(options?: TRouterBuilderOptions): RouterBuilderCore
}
