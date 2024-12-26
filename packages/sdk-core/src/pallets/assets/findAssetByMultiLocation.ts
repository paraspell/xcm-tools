import type { TForeignAsset, TJunction, TMultiLocation } from '../../types'
import { deepEqual } from '../../utils'

const sanitizeMultiLocation = (multiLocation: string): string =>
  multiLocation.replace(/"(\d+),(\d+)"/g, '"$1$2"')

export const findAssetByMultiLocation = (
  foreignAssets: TForeignAsset[],
  multiLocation: string | TMultiLocation | TJunction[]
): TForeignAsset | undefined => {
  if (typeof multiLocation === 'string') {
    const sanitizedInput = sanitizeMultiLocation(multiLocation)

    return foreignAssets.find(asset => {
      const assetMLStr = JSON.stringify(asset.multiLocation ?? '')
      const assetMLInteriorStr = JSON.stringify(asset.xcmInterior ?? '')

      const sanitizedAssetMLStr = sanitizeMultiLocation(assetMLStr)
      const sanitizedAssetMLInteriorStr = sanitizeMultiLocation(assetMLInteriorStr)

      return (
        // Compare inputNoCommas with assetNoCommas
        sanitizedInput === sanitizedAssetMLStr ||
        sanitizedInput === sanitizedAssetMLInteriorStr ||
        // Compare inputOriginal with assetNoCommas
        multiLocation === sanitizedAssetMLStr ||
        multiLocation === sanitizedAssetMLInteriorStr ||
        // Compare inputOriginal with assetOriginal
        multiLocation === assetMLStr ||
        multiLocation === assetMLInteriorStr ||
        // Compare inputNoCommas with assetOriginal
        sanitizedInput === assetMLStr ||
        sanitizedInput === assetMLInteriorStr
      )
    })
  } else if (Array.isArray(multiLocation)) {
    return foreignAssets.find(asset => deepEqual(asset.xcmInterior, multiLocation))
  } else {
    return foreignAssets.find(asset => deepEqual(asset.multiLocation, multiLocation))
  }
}
