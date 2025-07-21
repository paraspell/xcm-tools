import type { TMultiLocation } from '@paraspell/sdk-common'

import type { TMultiAsset } from './TMultiAsset'

export type TAmount = string | number | bigint

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

export type TMultiAssetWithFee = TMultiAsset & { isFeeAsset?: boolean }

export type TMultiLocationValue = string | TMultiLocation

export type TMultiLocationValueWithOverride = TMultiLocationValue | TOverrideMultiLocationSpecifier

export type TCurrencyInputWithAmount =
  | WithComplexAmount<
      TCurrencySymbol | { id: TCurrency } | { multilocation: TMultiLocationValueWithOverride }
    >
  | { multiasset: TMultiAsset<TAmount>[] | WithComplexAmount<TCurrencyCore>[] }

export type TCurrencyInput =
  | TCurrencySymbol
  | { id: TCurrency }
  | { multilocation: TMultiLocationValueWithOverride }
  | { multiasset: TMultiAsset<TAmount>[] | WithComplexAmount<TCurrencyCore>[] }

export type WithAmount<TBase, T = bigint> = TBase & {
  amount: T
}

export type WithComplexAmount<TBase> = WithAmount<TBase, TAmount>
