import type { TAsset, TCurrencyInput, TDestination, TNodeDotKsmWithRelayChains } from '../../types'
import { getAssetBySymbolOrId } from '../../pallets/assets/getAssetBySymbolOrId'
import { isTMultiLocation } from '../../pallets/xcmPallet/utils'

export const resolveAsset = (
  currency: TCurrencyInput,
  origin: TNodeDotKsmWithRelayChains,
  destination: TDestination,
  assetCheckEnabled: boolean
): TAsset | null => {
  return assetCheckEnabled
    ? getAssetBySymbolOrId(origin, currency, !isTMultiLocation(destination) ? destination : null)
    : null
}
