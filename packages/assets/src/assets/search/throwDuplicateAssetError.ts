import { DuplicateAssetError } from '../../errors'
import type { TForeignAsset, TNativeAsset } from '../../types'

export const throwDuplicateAssetError = (
  symbol: string,
  nativeMatches: TNativeAsset[],
  foreignMatches: TForeignAsset[]
) => {
  if (nativeMatches.length > 0 && foreignMatches.length > 0) {
    throw new DuplicateAssetError(
      `Multiple matches found for symbol ${symbol}. Please specify with Native() or Foreign() selector.`
    )
  } else if (foreignMatches.length > 1) {
    const aliases = foreignMatches
      .map(asset => {
        const idOrLocation =
          asset.assetId !== undefined
            ? `ID:${asset.assetId}`
            : `Location:${JSON.stringify(asset.multiLocation)}`
        return `${asset.alias} (${idOrLocation})`
      })
      .join(', ')

    throw new DuplicateAssetError(
      `Multiple foreign assets found for symbol ${symbol}. Please specify with ForeignAbstract() selector. Available aliases: ${aliases}`
    )
  }
}
