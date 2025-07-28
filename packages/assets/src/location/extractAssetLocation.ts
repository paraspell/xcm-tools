import type { TLocation } from '@paraspell/sdk-common'

import type { TAsset } from '../types'

export const extractAssetLocation = <T = bigint>(asset: TAsset<T>): TLocation =>
  'Concrete' in asset.id ? asset.id.Concrete : asset.id
