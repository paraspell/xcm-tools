import type { TAsset } from '@paraspell/assets'
import type {
  TMultiLocation,
  TNodePolkadotKusama,
  TNodeWithRelayChains
} from '@paraspell/sdk-common'

import type {
  BatchMode,
  TBridgeStatus,
  TDryRunCallBaseOptions,
  TDryRunNodeResultInternal,
  TDryRunXcmBaseOptions,
  TSerializedApiCall
} from '../types'
import type { TApiOrUrl } from '../types/TApi'

export interface IPolkadotApi<TApi, TRes> {
  setApi(api?: TApiOrUrl<TApi>): void
  getApi(): TApi
  getApiOrUrl(): TApiOrUrl<TApi> | undefined
  init(node: TNodeWithRelayChains, clientTtlMs?: number): Promise<void>
  createApiInstance: (wsUrl: string | string[]) => Promise<TApi>
  accountToHex(address: string, isPrefixed?: boolean): string
  accountToUint8a(address: string): Uint8Array
  callTxMethod(serializedCall: TSerializedApiCall): TRes
  callBatchMethod(calls: TRes[], mode: BatchMode): TRes
  objectToHex(obj: unknown, typeName: string): Promise<string>
  hexToUint8a(hex: string): Uint8Array
  stringToUint8a(str: string): Uint8Array
  getMethod(tx: TRes): string
  calculateTransactionFee(tx: TRes, address: string): Promise<bigint>
  quoteAhPrice(
    fromMl: TMultiLocation,
    toMl: TMultiLocation,
    amountIn: bigint,
    includeFee?: boolean
  ): Promise<bigint | undefined>
  getBalanceNative(address: string): Promise<bigint>
  getBalanceNativeAcala(address: string, symbol: string): Promise<bigint>
  getBalanceForeignPolkadotXcm(address: string, id?: string): Promise<bigint>
  getMythosForeignBalance(address: string): Promise<bigint>
  getBalanceForeignAssetsPallet(address: string, multiLocation: TMultiLocation): Promise<bigint>
  getForeignAssetsByIdBalance(address: string, assetId: string): Promise<bigint>
  getBalanceForeignXTokens(
    node: TNodePolkadotKusama,
    address: string,
    asset: TAsset
  ): Promise<bigint>
  getBalanceForeignBifrost(address: string, asset: TAsset): Promise<bigint>
  getBalanceAssetsPallet(address: string, assetId: bigint | number): Promise<bigint>
  getFromRpc(module: string, method: string, key: string): Promise<string>
  blake2AsHex(data: Uint8Array): string
  clone(): IPolkadotApi<TApi, TRes>
  createApiForNode(node: TNodeWithRelayChains): Promise<IPolkadotApi<TApi, TRes>>
  getDryRunCall(options: TDryRunCallBaseOptions<TRes>): Promise<TDryRunNodeResultInternal>
  getDryRunXcm(options: TDryRunXcmBaseOptions): Promise<TDryRunNodeResultInternal>
  getBridgeStatus(): Promise<TBridgeStatus>
  setDisconnectAllowed(allowed: boolean): void
  getDisconnectAllowed(): boolean
  disconnect(force?: boolean): Promise<void>
}
