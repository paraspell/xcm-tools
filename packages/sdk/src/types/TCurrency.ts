import type { TMultiLocation } from './TMultiLocation'
import type { TMultiAsset } from './TMultiAsset'
import type { Version } from './TTransfer'

export type TCurrency = string | number | bigint

export type TCurrencySymbol = {
  symbol: string
}

export type TCurrencyCore =
  | TCurrencySymbol
  | {
      id: TCurrency
    }

export type TCurrencyInput =
  | TCurrencyCore
  | {
      multilocation: TMultiLocation
    }
  | {
      multiasset: TMultiAsset[]
    }

export interface TCurrencySelection {
  id: {
    Concrete: TMultiLocation
  }
  fun: {
    Fungible: string
  }
}

export type TCurrencySelectionV4 = {
  id: TMultiLocation
  fun: {
    Fungible: string
  }
}

export type TCurrencySelectionHeader = {
  [key in Version]?: TCurrencySelection | TCurrencySelectionV4
}

export type TCurrencySelectionHeaderArr = {
  [key in Version]?: [TCurrencySelection | TCurrencySelectionV4]
}

export type TForeignAsset = {
  ForeignAsset: string | number | bigint | undefined
}

export type TForeignAssetId = {
  ForeignAssetId: string | undefined
}

export type TForeignOrTokenAsset = TForeignAsset | { Token: string | undefined }

export type TForeignOrNativeAsset = TForeignAsset | 'Native'

export type TXcmAsset = {
  XCM: string | undefined
}

export type TMantaAsset = {
  MantaCurrency: bigint | undefined
}

export type TNativeTokenAsset = 'NativeToken'

export type TNodleAsset = 'NodleNative'

export type TZeitgeistAsset = 'Ztg'

export type TOtherReserveAsset = {
  OtherReserve: string | undefined
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
  | TCurrencySelectionHeader
  | TCurrencySelectionHeaderArr
  | TForeignAsset
  | TForeignAssetId
  | TForeignOrTokenAsset
  | TXcmAsset
  | TMantaAsset
  | TOtherReserveAsset
  | TBifrostToken
  | string
  | bigint
  | undefined
