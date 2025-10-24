import { deepEqual } from '@paraspell/sdk-common'

import { isForeignAsset } from '../guards'
import type { TAssetInfo } from '../types'
import { isSymbolMatch } from './isSymbolMatch'

export const isAssetEqual = (asset1: TAssetInfo, asset2: TAssetInfo) => {
  const loc1 = asset1.location
  const loc2 = asset2.location

  if (loc1 && loc2) return deepEqual(loc1, loc2)

  if (isForeignAsset(asset1) && isForeignAsset(asset2) && asset1.assetId === asset2.assetId)
    return true

  return isSymbolMatch(asset1.symbol, asset2.symbol)
}
