import {
  getJunctionValue,
  getNativeAssetSymbol,
  getOtherAssets,
  hasJunction,
  type TLocation,
  type TSubstrateChain
} from '@paraspell/sdk-core'

export const getLocationTokenId = (location: TLocation, chain: TSubstrateChain): string | null => {
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
    const assetId = String(getJunctionValue(location, 'GeneralIndex')).replace(/,/g, '')
    return foreignAssets.find(asset => asset.assetId === assetId)?.symbol ?? null
  }

  return null
}
