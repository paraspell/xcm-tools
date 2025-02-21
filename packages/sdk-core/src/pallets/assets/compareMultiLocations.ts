import type { TForeignAsset } from '../../types'

const sanitizeMultiLocation = (multiLocation: string): string =>
  multiLocation.replace(/"(\d+),(\d+)"/g, '"$1$2"')

export const compareMultiLocations = (input: string, asset: TForeignAsset): boolean => {
  const sanitizedInput = sanitizeMultiLocation(input)
  const assetMLStr = JSON.stringify(asset.multiLocation ?? '')

  const sanitizedAssetMLStr = sanitizeMultiLocation(assetMLStr)

  return (
    // Compare sanitized input with sanitized asset values
    sanitizedInput === sanitizedAssetMLStr ||
    // Compare original input with sanitized asset values
    input === sanitizedAssetMLStr ||
    // Compare original input with original asset values
    input === assetMLStr ||
    // Compare sanitized input with original asset values
    sanitizedInput === assetMLStr
  )
}
