import { findAsset, type TAsset, type TCurrencyInput } from '@paraspell/assets'
import { isTMultiLocation, type TNodeDotKsmWithRelayChains } from '@paraspell/sdk-common'

import type { TDestination } from '../../types'

export const resolveAsset = (
  currency: TCurrencyInput,
  origin: TNodeDotKsmWithRelayChains,
  destination: TDestination,
  assetCheckEnabled: boolean
): TAsset | null => {
  return assetCheckEnabled
    ? findAsset(origin, currency, !isTMultiLocation(destination) ? destination : null)
    : null
}
