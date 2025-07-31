import { findAssetInfo, type TAssetInfo, type TCurrencyInput } from '@paraspell/assets'
import { isTLocation, type TChainDotKsmWithRelayChains } from '@paraspell/sdk-common'

import type { TDestination } from '../../types'

export const resolveAsset = (
  currency: TCurrencyInput,
  origin: TChainDotKsmWithRelayChains,
  destination: TDestination,
  assetCheckEnabled: boolean
): TAssetInfo | null => {
  return assetCheckEnabled
    ? findAssetInfo(origin, currency, !isTLocation(destination) ? destination : null)
    : null
}
