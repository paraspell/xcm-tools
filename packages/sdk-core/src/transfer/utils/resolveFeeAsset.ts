import type { TAssetInfo } from '@paraspell/assets'
import { findAssetInfo, isTAsset, type TCurrencyInput } from '@paraspell/assets'
import { isTLocation, type TSubstrateChain } from '@paraspell/sdk-common'

import { throwUnsupportedCurrency } from '../../pallets/xcmPallet/utils'
import type { TDestination } from '../../types'

export const resolveFeeAsset = (
  feeAsset: TCurrencyInput,
  origin: TSubstrateChain,
  destination: TDestination,
  currency: TCurrencyInput
): TAssetInfo | undefined => {
  const asset = findAssetInfo(origin, feeAsset, !isTLocation(destination) ? destination : null)

  const usesRawOverriddenMultiAssets =
    'multiasset' in currency && currency.multiasset.every(isTAsset)

  if (!asset && !usesRawOverriddenMultiAssets) {
    throwUnsupportedCurrency(feeAsset, origin)
  }

  return asset ?? undefined
}
