import { type TMultiLocation } from './TMultiLocation'
import { type TAmount } from './TTransfer'

export interface TMultiAsset {
  id: { Concrete: TMultiLocation }
  fun: {
    Fungible: TAmount
  }
}
