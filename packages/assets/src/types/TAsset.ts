import type { TLocation } from '@paraspell/sdk-common'

export type TAsset<T = bigint> = TAssetV3<T> | TAssetV4<T>

export interface TAssetV3<T = bigint> {
  id: { Concrete: TLocation }
  fun: {
    Fungible: T
  }
}

export interface TAssetV4<T = bigint> {
  id: TLocation
  fun: {
    Fungible: T
  }
}
