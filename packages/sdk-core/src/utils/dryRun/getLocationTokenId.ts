/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { getNativeAssetSymbol, getOtherAssets } from '@paraspell/assets'
import type { TNodeDotKsmWithRelayChains } from '@paraspell/sdk-common'

export const getLocationTokenId = (
  location: any,
  node: TNodeDotKsmWithRelayChains
): string | null => {
  if (location.interior.type === 'Here') {
    // native token
    return getNativeAssetSymbol(node)
  }

  const foreignAssets = getOtherAssets(node)

  if (location.interior.type === 'X2') {
    if (
      location.interior.value[0].type === 'PalletInstance' &&
      location.interior.value[0].value === 50 &&
      location.interior.value[1].type === 'GeneralIndex'
    ) {
      const assetId = location.interior.value[1].value
      return foreignAssets.find(asset => asset.assetId === String(assetId))?.assetId ?? null
    }
  }
  return null
}
