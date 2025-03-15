import type { TMultiLocation } from '@paraspell/sdk-common'

import type { TMultiAsset } from '../types'

export const extractMultiAssetLoc = (multiAsset: TMultiAsset): TMultiLocation =>
  'Concrete' in multiAsset.id ? multiAsset.id.Concrete : multiAsset.id
