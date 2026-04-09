import { extractAssetLocation, type TAsset } from '@paraspell/assets'
import type { Version } from '@paraspell/sdk-common'

import { createAssetId } from '../../asset'

export const createAssetsFilter = (asset: TAsset, version: Version) => {
  const location = extractAssetLocation(asset)
  const id = createAssetId(version, location)
  return {
    Wild: {
      AllOf: {
        id,
        fun: 'Fungible'
      }
    }
  }
}
