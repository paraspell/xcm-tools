import { getNativeAssetSymbol, getOtherAssets } from '@paraspell/assets'
import {
  getJunctionValue,
  hasJunction,
  type TChainDotKsmWithRelayChains,
  type TLocation
} from '@paraspell/sdk-common'

export const getLocationTokenIdPjs = (
  location: TLocation,
  chain: TChainDotKsmWithRelayChains
): string | null => {
  if (location.interior === 'Here') {
    // native token
    return getNativeAssetSymbol(chain)
  }

  const foreignAssets = getOtherAssets(chain)

  if (
    location.interior.X2 &&
    hasJunction(location, 'PalletInstance', '50') &&
    hasJunction(location, 'GeneralIndex')
  ) {
    const assetId = getJunctionValue<string>(location, 'GeneralIndex')
    return foreignAssets.find(asset => asset.assetId === String(assetId))?.symbol ?? null
  }

  return null
}
