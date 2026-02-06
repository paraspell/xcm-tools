import type { TAssetInfo } from '../types'
import { isAssetEqual } from './isAssetEqual'

export const isAssetXcEqual = (asset1: TAssetInfo, asset2: TAssetInfo) =>
  isAssetEqual(asset1, asset2)
