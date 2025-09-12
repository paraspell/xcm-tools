import { deepEqual } from '@paraspell/sdk-common'

import type { TAssetInfo } from '../types'
import { isSymbolMatch } from './isSymbolMatch'

export const isAssetXcEqual = (asset1: TAssetInfo, asset2: TAssetInfo) => {
  const ml1 = asset1.location
  const ml2 = asset2.location

  if (ml1 && ml2 && deepEqual(ml1, ml2)) return true

  return isSymbolMatch(asset1.symbol, asset2.symbol)
}
