import { TMultiLocation } from './TMultiLocation'
import { TMultiAsset } from './TMultiAsset'
import { Version } from './TTransfer'

export type TCurrency = string | number | bigint
export type TCurrencySpecifier =
  | {
      symbol: string
    }
  | {
      id: TCurrency
    }
export type TCurrencyCore = TCurrency | TMultiLocation | TMultiAsset[]
export type TCurrencyInput = TCurrencyCore | TCurrencySpecifier

export interface TCurrencySelection {
  id: {
    Concrete: TMultiLocation
  }
  fun: {
    Fungible: string
  }
}

export type TCurrencySelectionHeader = {
  [key in Version]?: TCurrencySelection
}

export type TCurrencySelectionHeaderArr = {
  [key in Version]?: [TCurrencySelection]
}
