import type { IPolkadotApi } from '../api'

export type WithApi<TBase, TApi, TRes> = TBase & {
  api: IPolkadotApi<TApi, TRes>
}

export type TUrl = string | string[]

export type TApiOrUrl<TApi> = TApi | TUrl
