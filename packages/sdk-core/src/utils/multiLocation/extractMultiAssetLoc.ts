import type { TMultiAsset, TMultiLocation } from '../../types'

export const extractMultiAssetLoc = (multiAsset: TMultiAsset): TMultiLocation =>
  'Concrete' in multiAsset.id ? multiAsset.id.Concrete : multiAsset.id
