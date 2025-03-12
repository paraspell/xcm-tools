import { getAssetBySymbolOrId } from '../../pallets/assets/getAssetBySymbolOrId'
import { isTMultiLocation, throwUnsupportedCurrency } from '../../pallets/xcmPallet/utils'
import type { TAsset, TCurrencyInput, TDestination, TNodeDotKsmWithRelayChains } from '../../types'

export const resolveFeeAsset = (
  feeAsset: TCurrencyInput,
  origin: TNodeDotKsmWithRelayChains,
  destination: TDestination
): TAsset | undefined => {
  const asset = getAssetBySymbolOrId(
    origin,
    feeAsset,
    !isTMultiLocation(destination) ? destination : null
  )

  if (!asset) {
    throwUnsupportedCurrency(feeAsset, origin)
  }

  return asset ?? undefined
}
