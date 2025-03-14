import type { TMultiAsset } from '@paraspell/assets'
import type { TMultiLocation } from '@paraspell/sdk-common'

import type { Version } from './TTransfer'

export type OneKey<K extends string, V = unknown> = {
  [P in K]: Record<P, V> & Partial<Record<Exclude<K, P>, never>> extends infer O
    ? { [Q in keyof O]: O[Q] }
    : never
}[K]

export type TXcmVersioned<T> = OneKey<Version, T>

export type TXcmForeignAsset = {
  ForeignAsset: string | number | bigint | undefined
}

export type TForeignAssetId = {
  ForeignAssetId: bigint | undefined
}

export type TForeignOrTokenAsset = TXcmForeignAsset | { Token: string | undefined }

export type TForeignOrNativeAsset = TXcmForeignAsset | 'Native'

export type TXcmAsset = {
  XCM: number | undefined
}

export type TMantaAsset = {
  MantaCurrency: bigint | undefined
}

export type TNativeTokenAsset = 'NativeToken'

export type TNodleAsset = 'NodleNative'

export type TZeitgeistAsset = 'Ztg'

export type TOtherReserveAsset = {
  OtherReserve: string | bigint | undefined
}

export type TSelfReserveAsset = 'SelfReserve'

export type TReserveAsset = TOtherReserveAsset | TSelfReserveAsset

export type TBifrostToken =
  | { Native: string }
  | { VToken: string }
  | { Token: string }
  | { VSToken2: number }
  | { VToken2: number }
  | { Token2: number }

export type TXTokensCurrencySelection =
  | TXcmVersioned<TMultiLocation | TMultiAsset | TMultiAsset[]>
  | TXcmForeignAsset
  | TForeignAssetId
  | TForeignOrTokenAsset
  | TXcmAsset
  | TMantaAsset
  | TOtherReserveAsset
  | TBifrostToken
  | string
  | bigint
  | number
  | undefined
