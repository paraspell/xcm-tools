import type { HexString, TApiType, TResType, TSerializedApiCall } from '../types'

export interface IPolkadotApi<TApi extends TApiType, TRes extends TResType> {
  init(api: TApi): void
  createAccountId(address: string): HexString
  call(serializedCall: TSerializedApiCall): TRes
}
