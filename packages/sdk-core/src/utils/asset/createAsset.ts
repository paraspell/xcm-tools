import type { TAsset } from '@paraspell/assets'
import type { TLocation } from '@paraspell/sdk-common'
import { Version } from '@paraspell/sdk-common'

import { addXcmVersionHeader } from '../xcm-version'

export const createId = (version: Version, location: TLocation) => {
  if (version === Version.V3) {
    return { Concrete: location }
  }

  return location
}

export const createAsset = (version: Version, amount: bigint, location: TLocation): TAsset => {
  if (version === Version.V3) {
    return {
      id: { Concrete: location },
      fun: { Fungible: amount }
    }
  }

  return {
    id: location,
    fun: { Fungible: amount }
  }
}

export const createVersionedAssets = (version: Version, amount: bigint, location: TLocation) => {
  const asset = createAsset(version, amount, location)
  return addXcmVersionHeader([asset], version)
}
