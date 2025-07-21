import type { TMultiLocation } from '@paraspell/sdk-common'

import type { TMultiAsset } from '../types'

export const extractMultiAssetLoc = <T = bigint>(multiAsset: TMultiAsset<T>): TMultiLocation =>
  'Concrete' in multiAsset.id ? multiAsset.id.Concrete : multiAsset.id
