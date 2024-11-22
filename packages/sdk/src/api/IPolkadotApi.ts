import type {
  HexString,
  TAsset,
  TMultiLocation,
  TNodeWithRelayChains,
  TSerializedApiCall
} from '../types'
import type { TApiOrUrl } from '../types/TApi'

export interface IPolkadotApi<TApi, TRes> {
  setApi(api?: TApiOrUrl<TApi>): void
  getApi(): TApi
  init(node: TNodeWithRelayChains): Promise<void>
  createApiInstance: (wsUrl: string) => Promise<TApi>
  createAccountId(address: string): HexString
  callTxMethod(serializedCall: TSerializedApiCall): TRes
  calculateTransactionFee(tx: TRes, address: string): Promise<bigint>
  getBalanceNative(address: string): Promise<bigint>
  getBalanceForeignPolkadotXcm(address: string, id?: string): Promise<bigint>
  getMythosForeignBalance(address: string): Promise<bigint>
  getAssetHubForeignBalance(address: string, multiLocation: TMultiLocation): Promise<bigint>
  getForeignAssetsByIdBalance(address: string, assetId: string): Promise<bigint>
  getBalanceForeignXTokens(address: string, asset: TAsset): Promise<bigint>
  getBalanceForeignBifrost(address: string, asset: TAsset): Promise<bigint>
  getBalanceForeignAssetsAccount(address: string, assetId: bigint | number): Promise<bigint>
  getFromStorage(key: string): Promise<string>
  clone(): IPolkadotApi<TApi, TRes>
  createApiForNode(node: TNodeWithRelayChains): Promise<IPolkadotApi<TApi, TRes>>
  setDisconnectAllowed(allowed: boolean): void
  getDisconnectAllowed(): boolean
  disconnect(): Promise<void>
}
