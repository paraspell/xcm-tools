import type { TMultiLocation } from '@paraspell/sdk-common'

import type { TAmount } from './TCurrency'

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
