import type { IPolkadotApi } from '../api'

export type WithApi<TBase, TApi, TRes> = TBase & {
  api: IPolkadotApi<TApi, TRes>
}

export type TUrl = string | string[]

export type TApiOrUrl<TApi> = TApi | TUrl

export type TClientKey = string

export type TClientEntry<T> = {
  client: T
  refs: number
  destroyWanted: boolean
}

export type TCacheItem<T> = {
  value: TClientEntry<T>
  ttl: number
  expireAt: number
  extended: boolean
}

export type ClientCache<T> = {
  set: (k: TClientKey, v: TClientEntry<T>, ttl: number) => void
  get: (k: TClientKey) => TClientEntry<T> | undefined
  delete: (k: TClientKey) => boolean
  has: (k: TClientKey) => boolean
  clear: () => void
  peek: (k: TClientKey) => TClientEntry<T> | undefined
  remainingTtl: (k: TClientKey) => number | undefined
  revive: (k: TClientKey, ttl: number) => void
}
