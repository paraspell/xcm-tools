import type {
  HexString,
  TAsset,
  TMultiLocation,
  TNodeWithRelayChains,
  TSerializedApiCallV2
} from '../types'

export interface IPolkadotApi<TApi, TRes> {
  setApi(api?: TApi): void
  getApi(): TApi
  init(node: TNodeWithRelayChains): Promise<void>
  createApiInstance: (wsUrl: string) => Promise<TApi>
  createAccountId(address: string): HexString
  callTxMethod(serializedCall: TSerializedApiCallV2): TRes
  calculateTransactionFee(tx: TRes, address: string): Promise<bigint>
  getBalanceNative(address: string): Promise<bigint>
  getBalanceForeign(address: string, id?: string): Promise<bigint | null>
  getMythosForeignBalance(address: string): Promise<bigint | null>
  getAssetHubForeignBalance(address: string, multiLocation: TMultiLocation): Promise<bigint | null>
  getBalanceForeignXTokens(address: string, asset: TAsset): Promise<bigint | null>
  clone(): IPolkadotApi<TApi, TRes>
}
