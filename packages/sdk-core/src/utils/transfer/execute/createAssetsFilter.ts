import { extractAssetLocation, type TAsset } from '@paraspell/assets'
import type { Version } from '@paraspell/sdk-common'

import { createId } from '../../asset'

export const createAssetsFilter = (asset: TAsset, version: Version) => {
  const location = extractAssetLocation(asset)
  const id = createId(version, location)
  return {
    Wild: {
      AllOf: {
        id,
        fun: 'Fungible'
      }
    }
  }
}
