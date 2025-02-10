import {
  Parents,
  type TCurrencyInput,
  type TJunction,
  type TMultiLocation,
  type TNodeWithRelayChains
} from '../../types'
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

  if (asset.xcmInterior) {
    const [secondLast, last] = asset.xcmInterior.slice(-2) as TJunction[]
    return {
      parents: Parents.ZERO,
      interior: { X2: [secondLast, last] }
    }
  }

  return null
}
