import type { TChain, TLocation } from '@paraspell/sdk-common'

import { findAssetInfo } from '../assets/search'
import type { TCurrencyInput } from '../types/TCurrency'

export const getAssetLocation = (chain: TChain, currency: TCurrencyInput): TLocation | null => {
  const asset = findAssetInfo(chain, currency, null)
  if (!asset || !asset.location) {
    return null
  }

  return asset.location
}
