import type { TForeignAssetInfo } from '../types'

const sanitizeLocation = (location: string): string => location.replace(/"(\d+),(\d+)"/g, '"$1$2"')

export const compareLocations = (input: string, asset: TForeignAssetInfo): boolean => {
  const sanitizedInput = sanitizeLocation(input)
  const assetMLStr = JSON.stringify(asset.location ?? '')

  const sanitizedAssetMLStr = sanitizeLocation(assetMLStr)

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
