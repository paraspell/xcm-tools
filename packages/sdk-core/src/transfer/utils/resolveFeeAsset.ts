import { getAssetBySymbolOrId } from '../../pallets/assets/getAssetBySymbolOrId'
import {
  isTMultiAsset,
  isTMultiLocation,
  throwUnsupportedCurrency
} from '../../pallets/xcmPallet/utils'
import type { TAsset, TCurrencyInput, TDestination, TNodeDotKsmWithRelayChains } from '../../types'

export const resolveFeeAsset = (
  feeAsset: TCurrencyInput,
  origin: TNodeDotKsmWithRelayChains,
  destination: TDestination,
  currency: TCurrencyInput
): TAsset | undefined => {
  const asset = getAssetBySymbolOrId(
    origin,
    feeAsset,
    !isTMultiLocation(destination) ? destination : null
  )

  const usesRawOverriddenMultiAssets =
    'multiasset' in currency && currency.multiasset.every(isTMultiAsset)

  if (!asset && !usesRawOverriddenMultiAssets) {
    throwUnsupportedCurrency(feeAsset, origin)
  }

  return asset ?? undefined
}
