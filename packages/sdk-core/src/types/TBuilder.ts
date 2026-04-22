import type { TCurrencyInputWithAmount } from '@paraspell/assets'
import type { TChain } from '@paraspell/sdk-common'
import type { WalletClient } from 'viem'

import type { GeneralBuilder } from '../builder'
import type { WithApi } from './TApi'
import type { TTransactionContext } from './TSwap'
import type { TSubstrateTransferOptions, TTransferBaseOptions, TTransferOptions } from './TTransfer'

export type TEvmTransferOptionsBase = {
  from: TChain
  to: TChain
  currency: TCurrencyInputWithAmount
  recipient: string
  ahAddress?: string
  signer: WalletClient
}

export type TEvmTransferOptions<TApi, TRes, TSigner> = WithApi<
  TEvmTransferOptionsBase,
  TApi,
  TRes,
  TSigner
>

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
  development: boolean
  abstractDecimals: boolean
  xcmFormatCheck: boolean
}>

export type TCreateTxsOptions<TApi, TRes, TSigner> = Pick<
  TTransferOptions<TApi, TRes, TSigner>,
  'api' | 'from' | 'to' | 'currency'
>

export type TBatchedTransferOptions<TApi, TRes, TSigner> = Omit<
  TSubstrateTransferOptions<TApi, TRes, TSigner>,
  'isAmountAll'
> & {
  builder: GeneralBuilder<
    TApi,
    TRes,
    TSigner,
    TTransferBaseOptions<TApi, TRes, TSigner> & TBuilderInternalOptions<TSigner>
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
  >
> = {
  options: TTransferOptions<TApi, TRes, TSigner> & TOptions
}

export type TBuildInternalRes<
  TApi,
  TRes,
  TSigner,
  TOptions extends TTransferBaseOptions<TApi, TRes, TSigner> = TTransferBaseOptions<
    TApi,
    TRes,
    TSigner
  >
> = TBuildInternalResBase<TApi, TRes, TSigner, TOptions> & {
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
  >
> = TBuildInternalResBase<TApi, TRes, TSigner, TOptions> & {
  txContexts: TTransactionContext<TApi, TRes>[]
}

// Sender can be either address, derivation path or signer
export type TSender<TSigner> = string | TSigner

export type TBuilderInternalOptions<TSigner> = {
  senderSource?: TSender<TSigner> | WalletClient
}
