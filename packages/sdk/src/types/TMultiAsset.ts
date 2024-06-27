import { type TMultiLocation } from './TMultiLocation'
import { type TAmount } from './TTransfer'

export type TMultiAsset = TMultiAssetV3 | TMultiAssetV4

export interface TMultiAssetV3 {
  id: { Concrete: TMultiLocation }
  fun: {
    Fungible: TAmount
  }
}

export interface TMultiAssetV4 {
  id: TMultiLocation
  fun: {
    Fungible: TAmount
  }
}
