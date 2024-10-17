import type {
  HexString,
  TCurrencyCore,
  TMultiLocation,
  TNodeWithRelayChains,
  TSerializedApiCallV2
} from '../types'

export interface IPolkadotApi<TApi, TRes> {
  setApi(api?: TApi): void
  getApi(): TApi
  init(node: TNodeWithRelayChains): Promise<void>

  /**
   * Creates an API instance connected to a specified node.
   *
   * @param node - The node for which to create the API instance.
   * @returns A Promise that resolves to the API instance.
   */
  createApiInstance: (wsUrl: string) => Promise<TApi>
  createAccountId(address: string): HexString
  callTxMethod(serializedCall: TSerializedApiCallV2): TRes
  calculateTransactionFee(tx: TRes, address: string): Promise<bigint>
  getBalanceNative(address: string): Promise<bigint>
  getBalanceForeign(address: string, id?: string): Promise<bigint | null>
  getMythosForeignBalance(address: string): Promise<bigint | null>
  getAssetHubForeignBalance(address: string, multiLocation: TMultiLocation): Promise<bigint | null>
  getBalanceForeignXTokens(
    address: string,
    symbolOrId: TCurrencyCore,
    symbol: string | undefined,
    id: string | undefined
  ): Promise<bigint | null>
}
