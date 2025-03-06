import type { TMultiAsset } from './TMultiAsset'
import type { TMultiLocation } from './TMultiLocation'
import type { TAmount, Version } from './TTransfer'

export type TCurrency = string | number | bigint

export type TSymbolSpecifier = {
  type: 'Native' | 'Foreign' | 'ForeignAbstract'
  value: string
}

export type TOverrideMultiLocationSpecifier = {
  type: 'Override'
  value: TMultiLocation
}

export type TCurrencySymbolValue = string | TSymbolSpecifier

export type TCurrencySymbol = {
  symbol: TCurrencySymbolValue
}

export type TCurrencyCore =
  | TCurrencySymbol
  | {
      id: TCurrency
    }
  | {
      multilocation: TMultiLocationValue
    }

export type TCurrencyCoreWithFee = WithAmount<TCurrencyCore> & { isFeeAsset?: boolean }
export type TMultiAssetWithFee = TMultiAsset & { isFeeAsset?: boolean }

export type TMultiLocationValue = string | TMultiLocation

export type TMultiLocationValueWithOverride = TMultiLocationValue | TOverrideMultiLocationSpecifier

export type TCurrencyInputWithAmount =
  | WithAmount<
      TCurrencySymbol | { id: TCurrency } | { multilocation: TMultiLocationValueWithOverride }
    >
  | { multiasset: TMultiAssetWithFee[] | TCurrencyCoreWithFee[] }

export type TCurrencyInput =
  | TCurrencySymbol
  | { id: TCurrency }
  | { multilocation: TMultiLocationValueWithOverride }
  | { multiasset: TMultiAssetWithFee[] | TCurrencyCoreWithFee[] }

export type WithAmount<TBase> = TBase & {
  amount: TAmount
}

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
