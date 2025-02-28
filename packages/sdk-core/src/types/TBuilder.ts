import type { AbstractProvider, Signer } from 'ethers'
import type { TNodeDotKsmWithRelayChains, TNodeWithRelayChains } from './TNode'
import type { TCurrencyInputWithAmount } from './TCurrency'
import type { TAddress, TDestination, TVersionClaimAssets, Version } from './TTransfer'
import type { TMultiAsset } from './TMultiAsset'
import type { TDryRunResult } from './TDryRun'
import type { WithApi } from './TApi'
import type { WalletClient } from 'viem'

/**
 * The options for the Ethereum to Polkadot transfer builder.
 */
export type TEvmBuilderOptionsBase = {
  /**
   * The source node. Can be either 'Ethereum' or 'Moonbeam'.
   */
  from: 'Ethereum' | 'Moonbeam' | 'Moonriver'
  /**
   * The destination node on Polkadot network.
   */
  to: TNodeWithRelayChains
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
  signer: Signer | WalletClient
}

export type TEvmBuilderOptions<TApi, TRes> = WithApi<TEvmBuilderOptionsBase, TApi, TRes> & {
  provider?: AbstractProvider
}

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

type OptionalProperties<T> = {
  [P in keyof T]?: T[P] | undefined
}

export type TOptionalEvmBuilderOptions<TApi, TRes> = OptionalProperties<
  TEvmBuilderOptions<TApi, TRes>
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

export interface IFromBuilder<TApi, TRes> {
  from: (node: TNodeDotKsmWithRelayChains) => IToBuilder<TApi, TRes>
  claimFrom: (node: TNodeWithRelayChains) => IFungibleBuilder<TApi, TRes>
  buildBatch: (options?: TBatchOptions) => Promise<TRes>
  getApi: () => TApi
  disconnect: () => Promise<void>
}

export interface IToBuilder<TApi, TRes> {
  to: (node: TDestination, paraIdTo?: number) => ICurrencyBuilder<TApi, TRes>
}

export interface ICurrencyBuilder<TApi, TRes> {
  currency: (currency: TCurrencyInputWithAmount) => IAddressBuilder<TApi, TRes>
}

export interface IFinalBuilder<TApi, TRes> {
  disconnect: () => Promise<void>
  getApi: () => TApi
  build: () => Promise<TRes>
}

export interface IAddressBuilder<TApi, TRes> {
  address: (address: TAddress, senderAddress?: string) => IFinalBuilderWithOptions<TApi, TRes>
}

export interface IFungibleBuilder<TApi, TRes> {
  fungible: (multiAssets: TMultiAsset[]) => IAccountBuilder<TApi, TRes>
}

export interface IAccountBuilder<TApi, TRes> {
  account: (address: TAddress) => IVersionBuilder<TApi, TRes>
}

export interface IVersionBuilder<TApi, TRes> extends IFinalBuilder<TApi, TRes> {
  xcmVersion: (version: TVersionClaimAssets) => IFinalBuilder<TApi, TRes>
}

export interface IAddToBatchBuilder<TApi, TRes> {
  addToBatch(): IFromBuilder<TApi, TRes>
}

export interface IFinalBuilderWithOptions<TApi, TRes> extends IAddToBatchBuilder<TApi, TRes> {
  xcmVersion: (version: Version) => this
  customPallet: (pallet: string, method: string) => this
  disconnect: () => Promise<void>
  getApi: () => TApi
  build: () => Promise<TRes>
  dryRun: (senderAddress: string) => Promise<TDryRunResult>
}
