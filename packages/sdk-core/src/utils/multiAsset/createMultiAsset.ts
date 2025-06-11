import type { TAmount, TMultiAsset } from '@paraspell/assets'
import type { TMultiLocation } from '@paraspell/sdk-common'
import { Version } from '@paraspell/sdk-common'

import { addXcmVersionHeader } from '../addXcmVersionHeader'

export const createMultiAsset = (
  version: Version,
  amount: TAmount,
  multiLocation: TMultiLocation
): TMultiAsset => {
  if (version === Version.V4 || version === Version.V5) {
    return {
      id: multiLocation,
      fun: { Fungible: amount }
    }
  }

  return {
    id: { Concrete: multiLocation },
    fun: { Fungible: amount }
  }
}

export const createVersionedMultiAssets = (
  version: Version,
  amount: TAmount,
  multiLocation: TMultiLocation
) => {
  const multiAsset = createMultiAsset(version, amount, multiLocation)
  return addXcmVersionHeader([multiAsset], version)
}
