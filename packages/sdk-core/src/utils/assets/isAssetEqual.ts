import type { TAsset } from '../../types'
import { deepEqual } from '../deepEqual'
import { isForeignAsset } from './isForeignAsset'

export const isAssetEqual = (asset1: TAsset, asset2: TAsset) => {
  const ml1 = asset1.multiLocation
  const ml2 = asset2.multiLocation

  if (ml1 && ml2 && deepEqual(ml1, ml2)) return true

  if (isForeignAsset(asset1) && isForeignAsset(asset2) && asset1.assetId === asset2.assetId)
    return true

  return asset1.symbol.toLowerCase() === asset2.symbol.toLowerCase()
}
