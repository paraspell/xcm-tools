import type { Signer } from 'ethers'
import type { TNodeDotKsmWithRelayChains, TNodePolkadotKusama, TNodeWithRelayChains } from './TNode'
import type { TCurrencyCoreV1, TCurrencyInputWithAmount } from './TCurrency'
import type { TAddress, TDestination, TVersionClaimAssets, Version } from './TTransfer'
import type { TMultiAsset } from './TMultiAsset'

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
  currency: TCurrencyCoreV1
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

export interface IFromBuilder<TApi, TRes> {
  from: (node: TNodeDotKsmWithRelayChains) => IToBuilder<TApi, TRes>
  claimFrom: (node: TNodeWithRelayChains) => IFungibleBuilder<TRes>
  buildBatch: (options?: TBatchOptions) => Promise<TRes>
}

export interface IToBuilder<TApi, TRes> {
  to: (node: TDestination, paraIdTo?: number) => ICurrencyBuilder<TApi, TRes>
}

export interface ICurrencyBuilder<TApi, TRes> {
  currency: (currency: TCurrencyInputWithAmount) => IAddressBuilder<TApi, TRes>
}

export interface IFinalBuilder<TRes> {
  build: () => Promise<TRes>
}

export interface IAddressBuilder<TApi, TRes> {
  address: (address: TAddress, ahAddress?: string) => IUseKeepAliveFinalBuilder<TApi, TRes>
}

export interface IFungibleBuilder<TRes> {
  fungible: (multiAssets: TMultiAsset[]) => IAccountBuilder<TRes>
}

export interface IAccountBuilder<TRes> {
  account: (address: TAddress) => IVersionBuilder<TRes>
}

export interface IVersionBuilder<TRes> extends IFinalBuilder<TRes> {
  xcmVersion: (version: TVersionClaimAssets) => IFinalBuilder<TRes>
}

export interface IAddToBatchBuilder<TApi, TRes> {
  addToBatch(): IFromBuilder<TApi, TRes>
}

export interface IUseKeepAliveFinalBuilder<TApi, TRes> extends IAddToBatchBuilder<TApi, TRes> {
  useKeepAlive: (destApi: TApi) => this
  xcmVersion: (version: Version) => this
  build: () => Promise<TRes>
}
