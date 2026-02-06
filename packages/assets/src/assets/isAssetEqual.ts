import { deepEqual } from '@paraspell/sdk-common'

import type { TAssetInfo } from '../types'

export const isAssetEqual = (asset1: TAssetInfo, asset2: TAssetInfo) => {
  const loc1 = asset1.location
  const loc2 = asset2.location
  return deepEqual(loc1, loc2)
}
