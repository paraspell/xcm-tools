import { DuplicateAssetIdError } from '../../errors'
import type { TAssetInfo, TCurrency } from '../../types'

export const findAssetInfoById = (assets: TAssetInfo[], assetId: TCurrency) => {
  const id = assetId.toString()

  const matches = assets.filter(a => a.assetId === id)

  if (matches.length > 1) {
    throw new DuplicateAssetIdError(id)
  }

  return matches[0]
}
