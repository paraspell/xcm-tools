import type { TLocation } from '@paraspell/sdk-common'

import type { TAsset } from './TAsset'

export type TAmount = string | number | bigint

export type TCurrency = string | number | bigint

export type TSymbolSpecifier = {
  type: 'Native' | 'Foreign' | 'ForeignAbstract'
  value: string
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
      location: TLocationValue
    }

export type TAssetWithFee = TAsset & { isFeeAsset?: boolean }

export type TLocationValue = string | TLocation

export type TCurrencyInputWithAmount =
  | WithComplexAmount<TCurrencySymbol | { id: TCurrency } | { location: TLocationValue }>
  | WithComplexAmount<TCurrencyCore>[]

export type TSingleCurrencyInputWithAmount = Exclude<TCurrencyInputWithAmount, unknown[]>

export type TSingleCurrencyInput = Exclude<TCurrencyInput, unknown[]>

export type TCurrencyInput =
  | TCurrencySymbol
  | { id: TCurrency }
  | { location: TLocationValue }
  | WithComplexAmount<TCurrencyCore>[]

export type WithAmount<TBase, T = bigint> = TBase & {
  amount: T
}

export type WithOptionalAmount<TBase, T = bigint> = TBase & {
  amount?: T
}

export type WithComplexAmount<TBase> = WithAmount<TBase, TAmount>
