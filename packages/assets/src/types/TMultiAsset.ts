import type { TMultiLocation } from '@paraspell/sdk-common'

export type TMultiAsset<T = bigint> = TMultiAssetV3<T> | TMultiAssetV4<T>

export interface TMultiAssetV3<T = bigint> {
  id: { Concrete: TMultiLocation }
  fun: {
    Fungible: T
  }
}

export interface TMultiAssetV4<T = bigint> {
  id: TMultiLocation
  fun: {
    Fungible: T
  }
}
