/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { getNativeAssetSymbol, getOtherAssets } from '../../pallets/assets'
import type { TForeignAsset, TMultiLocation, TNodeDotKsmWithRelayChains } from '../../types'

export const getMultiLocationTokenIdPjs = (
  location: TMultiLocation,
  node: TNodeDotKsmWithRelayChains
): string | null => {
  if (location.interior === 'Here') {
    // native token
    return getNativeAssetSymbol(node)
  }

  const foreignAssets = getOtherAssets(node)

  if (Object.keys(location.interior)[0] === 'X2') {
    const junctions = Object.values(location.interior)[0]
    if (
      Object.keys(junctions[0])[0] === 'PalletInstance' &&
      junctions[0].PalletInstance === '50' &&
      Object.keys(junctions[1])[0] === 'GeneralIndex'
    ) {
      const assetId = junctions[1].GeneralIndex
      return (
        foreignAssets.find((asset: TForeignAsset) => asset.assetId === String(assetId))?.symbol ??
        null
      )
    }
  }
  return null
}
