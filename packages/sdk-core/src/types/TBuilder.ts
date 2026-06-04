import type { TCurrencyInputWithAmount, TCustomAssetsMap } from '@paraspell/assets'
import type { TChain } from '@paraspell/sdk-common'
import type { WalletClient } from 'viem'

import type { GeneralBuilder } from '../builder'
import type { WithApi } from './TApi'
import type { TCustomChainsMap } from './TCustomChain'
import type { TTransactionContext } from './TSwap'
import type { TSubstrateTransferOptions, TTransferBaseOptions, TTransferOptions } from './TTransfer'

export type TEvmTransferOptionsBase = {
  from: TChain
  to: TChain
  currency: TCurrencyInputWithAmount
  recipient: string
  ahAddress?: string
}

export type TEvmTransferOptions<TApi, TRes, TSigner, TCustomChain extends string = never> = WithApi<
  TEvmTransferOptionsBase & { signer: WalletClient },
  TApi,
  TRes,
  TSigner,
  TCustomChain
>

export type TBuildEvmTransferOptions<
  TApi,
  TRes,
  TSigner,
  TCustomChain extends string = never
> = WithApi<TEvmTransferOptionsBase & { sender: string }, TApi, TRes, TSigner, TCustomChain>

/**
 * The options for the batch builder.
 */
export enum BatchMode {
  /**
   * Does not commit if one of the calls in the batch fails.
   */
  BATCH_ALL = 'BATCH_ALL',
  /**
   * Commits each successful call regardless if a call fails.
   */
  BATCH = 'BATCH'
}

/**
 * The options for the batch builder.
 */
export type TBatchOptions = {
  /**
   * The batch mode. Can be either:
   * `BATCH_ALL` - does not commit if one of the calls in the batch fails.
   * `BATCH` - commits each successful call regardless if a call fails.
   */
  mode: BatchMode
}

export type TDryRunPreviewOptions = {
  mintFeeAssets?: boolean
}

export type TBuilderOptions<TApi> = TApi | TBuilderConfig<TApi>

export type TBuilderConfig<TApi> = Partial<{
  apiOverrides: Partial<Record<TChain, TApi>>
  customAssets: TCustomAssetsMap
  customChains: TCustomChainsMap
  development: boolean
  abstractDecimals: boolean
  xcmFormatCheck: boolean
}>

export type TCustomChainFrom<TOpts> = TOpts extends { customChains: infer C }
  ? Extract<keyof C, string>
  : never

export type TCreateTxsOptions<TApi, TRes, TSigner, TCustomChain extends string = never> = Pick<
  TTransferOptions<TApi, TRes, TSigner, TCustomChain>,
  'api' | 'from' | 'to' | 'currency'
>

export type TBatchedTransferOptions<
  TApi,
  TRes,
  TSigner,
  TCustomChain extends string = never
> = Omit<TSubstrateTransferOptions<TApi, TRes, TSigner, TCustomChain>, 'isAmountAll'> & {
  builder: GeneralBuilder<
    TApi,
    TRes,
    TSigner,
    TTransferBaseOptions<TApi, TRes, TSigner> & TBuilderInternalOptions<TSigner>,
    TCustomChain
  >
}

export type TBuildInternalResBase<
  TApi,
  TRes,
  TSigner,
  TOptions extends TTransferBaseOptions<TApi, TRes, TSigner> = TTransferBaseOptions<
    TApi,
    TRes,
    TSigner
  >,
  TCustomChain extends string = never
> = {
  options: TTransferOptions<TApi, TRes, TSigner, TCustomChain> & TOptions
}

export type TBuildInternalRes<
  TApi,
  TRes,
  TSigner,
  TOptions extends TTransferBaseOptions<TApi, TRes, TSigner> = TTransferBaseOptions<
    TApi,
    TRes,
    TSigner
  >,
  TCustomChain extends string = never
> = TBuildInternalResBase<TApi, TRes, TSigner, TOptions, TCustomChain> & {
  tx: TRes
}

export type TBuildAllInternalRes<
  TApi,
  TRes,
  TSigner,
  TOptions extends TTransferBaseOptions<TApi, TRes, TSigner> = TTransferBaseOptions<
    TApi,
    TRes,
    TSigner
  >,
  TCustomChain extends string = never
> = TBuildInternalResBase<TApi, TRes, TSigner, TOptions, TCustomChain> & {
  txContexts: TTransactionContext<TApi, TRes>[]
}

// Sender can be either address, derivation path or signer
export type TSender<TSigner> = string | TSigner

export type TBuilderInternalOptions<TSigner> = {
  senderSource?: TSender<TSigner> | WalletClient
}
