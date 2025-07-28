import type { TLocation, TNodeWithRelayChains } from '@paraspell/sdk-common'

import { findAssetInfo } from '../assets/search'
import type { TCurrencyInput } from '../types/TCurrency'

export const getAssetLocation = (
  node: TNodeWithRelayChains,
  currency: TCurrencyInput
): TLocation | null => {
  const asset = findAssetInfo(node, currency, null)
  if (!asset || !asset.location) {
    return null
  }

  return asset.location
}
