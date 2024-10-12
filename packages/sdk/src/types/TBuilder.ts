import type { Signer } from 'ethers'
import type { TNodePolkadotKusama } from './TNode'
import type { TCurrencyCore } from './TCurrency'

/**
 * The options for the Ethereum to Polkadot transfer builder.
 */
export type TEvmBuilderOptions = {
  /**
   * The destination node on Polkadot network.
   */
  to: TNodePolkadotKusama
  /**
   * The amount to transfer.
   */
  amount: string
  /**
   * The currency to transfer. Symbol or ID.
   */
  currency: TCurrencyCore
  /**
   * The Polkadot destination address.
   */
  address: string
  /**
   * The Ethereum signer.
   */
  signer: Signer
}

export type TSerializeEthTransferOptions = Omit<TEvmBuilderOptions, 'signer'> & {
  destAddress: string
}

export type TSerializedEthTransfer = {
  token: string
  destinationParaId: number
  destinationFee: bigint
  amount: bigint
  fee: bigint
}

type OptionalProperties<T> = {
  [P in keyof T]?: T[P] | undefined
}

export type TOptionalEvmBuilderOptions = OptionalProperties<TEvmBuilderOptions>

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
