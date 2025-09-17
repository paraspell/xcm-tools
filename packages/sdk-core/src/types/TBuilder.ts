import type { TCurrencyInputWithAmount } from '@paraspell/assets'
import type { TChain } from '@paraspell/sdk-common'
import type { WalletClient } from 'viem'

import type { WithApi } from './TApi'
import type { TSendOptions } from './TTransfer'

export type TEvmChainFrom = Extract<TChain, 'Ethereum' | 'Moonbeam' | 'Moonriver' | 'Darwinia'>

/**
 * The options for the Ethereum to Polkadot transfer builder.
 */
export type TEvmBuilderOptionsBase = {
  /**
   * The source chain. Can be either 'Ethereum', 'Moonbeam', 'Moonriver', or 'Darwinia'.
   */
  from: TEvmChainFrom
  /**
   * The destination chain on Polkadot network.
   */
  to: TChain
  /**
   * The currency to transfer. Symbol or ID.
   */
  currency: TCurrencyInputWithAmount
  /**
   * The Polkadot destination address.
   */
  address: string
  /**
   * The AssetHub address
   */
  ahAddress?: string
  /**
   * The Ethereum signer.
   */
  signer: WalletClient
}

export type TEvmBuilderOptions<TApi, TRes> = WithApi<TEvmBuilderOptionsBase, TApi, TRes>

export type TSerializeEthTransferOptions = Omit<TEvmBuilderOptionsBase, 'signer'> & {
  destAddress: string
}

export type TSerializedEthTransfer = {
  token: string
  destinationParaId: number
  destinationFee: bigint
  amount: bigint
  fee: bigint
}

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

export type TBuilderConfig<TApi> = {
  apiOverrides?: Partial<Record<TChain, TApi>>
  development?: boolean
  abstractDecimals?: boolean
  xcmFormatCheck?: boolean
}

export type TCreateTxsOptions<TApi, TRes> = Pick<
  TSendOptions<TApi, TRes>,
  'api' | 'from' | 'to' | 'currency'
>
