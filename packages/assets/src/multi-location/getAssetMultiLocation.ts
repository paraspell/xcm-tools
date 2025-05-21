import type { TMultiLocation, TNodeWithRelayChains } from '@paraspell/sdk-common'

import { findAsset } from '../assets/search'
import type { TCurrencyInput } from '../types/TCurrency'

export const getAssetMultiLocation = (
  node: TNodeWithRelayChains,
  currency: TCurrencyInput
): TMultiLocation | null => {
  const asset = findAsset(node, currency, null)
  if (!asset || !asset.multiLocation) {
    return null
  }

  return asset.multiLocation
}
