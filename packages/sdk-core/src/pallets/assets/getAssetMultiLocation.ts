import { type TCurrencyInput, type TMultiLocation, type TNodeWithRelayChains } from '../../types'
import { isForeignAsset } from '../../utils'
import { getAssetBySymbolOrId } from './getAssetBySymbolOrId'

export const getAssetMultiLocation = (
  node: TNodeWithRelayChains,
  currency: TCurrencyInput
): TMultiLocation | null => {
  const asset = getAssetBySymbolOrId(node, currency, null)
  if (!asset || !isForeignAsset(asset)) {
    return null
  }

  if (asset.multiLocation) {
    return asset.multiLocation as TMultiLocation
  }

  return null
}
