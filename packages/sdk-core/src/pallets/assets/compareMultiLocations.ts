import type { TForeignAsset } from '../../types'

const sanitizeMultiLocation = (multiLocation: string): string =>
  multiLocation.replace(/"(\d+),(\d+)"/g, '"$1$2"')

export const compareMultiLocations = (input: string, asset: TForeignAsset): boolean => {
  const sanitizedInput = sanitizeMultiLocation(input)
  const assetMLStr = JSON.stringify(asset.multiLocation ?? '')
  const assetMLInteriorStr = JSON.stringify(asset.xcmInterior ?? '')

  const sanitizedAssetMLStr = sanitizeMultiLocation(assetMLStr)
  const sanitizedAssetMLInteriorStr = sanitizeMultiLocation(assetMLInteriorStr)

  return (
    // Compare sanitized input with sanitized asset values
    sanitizedInput === sanitizedAssetMLStr ||
    sanitizedInput === sanitizedAssetMLInteriorStr ||
    // Compare original input with sanitized asset values
    input === sanitizedAssetMLStr ||
    input === sanitizedAssetMLInteriorStr ||
    // Compare original input with original asset values
    input === assetMLStr ||
    input === assetMLInteriorStr ||
    // Compare sanitized input with original asset values
    sanitizedInput === assetMLStr ||
    sanitizedInput === assetMLInteriorStr
  )
}
