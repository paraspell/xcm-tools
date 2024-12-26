import type { IPolkadotApi } from '../api'

export type WithApi<TBase, TApi, TRes> = TBase & {
  api: IPolkadotApi<TApi, TRes>
}

export type TApiOrUrl<TApi> = TApi | string | string[]
