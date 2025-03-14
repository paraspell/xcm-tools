import type { TMultiLocation, TNodeWithRelayChains } from '@paraspell/sdk-common'

import { findAsset } from '../assets/search'
import { isForeignAsset } from '../guards'
import type { TCurrencyInput } from '../types/TCurrency'

export const getAssetMultiLocation = (
  node: TNodeWithRelayChains,
  currency: TCurrencyInput
): TMultiLocation | null => {
  const asset = findAsset(node, currency, null)
  if (!asset || !isForeignAsset(asset)) {
    return null
  }

  if (asset.multiLocation) {
    return asset.multiLocation as TMultiLocation
  }

  return null
}
