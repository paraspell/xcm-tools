import { TMultiLocation } from './TMultiLocation'
import { TMultiAsset } from './TMultiAsset'
import { Version } from './TTransfer'

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
  ForeignAsset: string | undefined
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
  MantaCurrency: string | undefined
}

export type TNativeTokenAsset = 'NativeToken'

export type TNodleAsset = 'NodleNative'

export type TZeitgeistAsset = 'Ztg'

export type TOtherReserveAsset = {
  OtherReserve: string | undefined
}

export type TSelfReserveAsset = 'SelfReserve'

export type TReserveAsset = TOtherReserveAsset | TSelfReserveAsset

export type TXTokensCurrencySelection =
  | TCurrencySelectionHeader
  | TForeignAsset
  | TForeignAssetId
  | TForeignOrTokenAsset
  | TXcmAsset
  | TMantaAsset
  | TOtherReserveAsset
  | string
  | undefined
