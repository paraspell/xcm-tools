import { deepEqual } from '@paraspell/sdk-common'

import { isForeignAsset } from '../guards'
import type { TAssetInfo } from '../types'

export const isAssetEqual = (asset1: TAssetInfo, asset2: TAssetInfo) => {
  const ml1 = asset1.location
  const ml2 = asset2.location

  if (ml1 && ml2 && deepEqual(ml1, ml2)) return true

  if (isForeignAsset(asset1) && isForeignAsset(asset2) && asset1.assetId === asset2.assetId)
    return true

  return asset1.symbol.toLowerCase() === asset2.symbol.toLowerCase()
}
