import type { TAsset } from '@paraspell/assets'
import { findAsset, isTMultiAsset, type TCurrencyInput } from '@paraspell/assets'
import { isTMultiLocation, type TNodeDotKsmWithRelayChains } from '@paraspell/sdk-common'

import { throwUnsupportedCurrency } from '../../pallets/xcmPallet/utils'
import type { TDestination } from '../../types'

export const resolveFeeAsset = (
  feeAsset: TCurrencyInput,
  origin: TNodeDotKsmWithRelayChains,
  destination: TDestination,
  currency: TCurrencyInput
): TAsset | undefined => {
  const asset = findAsset(origin, feeAsset, !isTMultiLocation(destination) ? destination : null)

  const usesRawOverriddenMultiAssets =
    'multiasset' in currency && currency.multiasset.every(isTMultiAsset)

  if (!asset && !usesRawOverriddenMultiAssets) {
    throwUnsupportedCurrency(feeAsset, origin)
  }

  return asset ?? undefined
}
