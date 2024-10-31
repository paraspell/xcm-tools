// Contains function for getting Asset ID or Symbol used in XCM call creation

import { DuplicateAssetError, DuplicateAssetIdError, InvalidCurrencyError } from '../../errors'
import type {
  TAsset,
  TAssetDetails,
  TCurrency,
  TNativeAssetDetails,
  TNodePolkadotKusama,
  TNodeWithRelayChains
} from '../../types'
import { isRelayChain } from '../../utils'
import { getDefaultPallet } from '../pallets'

export const findAssetBySymbol = (
  node: TNodeWithRelayChains,
  destination: TNodeWithRelayChains | undefined,
  otherAssets: TAssetDetails[],
  nativeAssets: TNativeAssetDetails[],
  combinedAssets: TAsset[],
  symbol: string,
  isRelayDestination: boolean
) => {
  const lowerSymbol = symbol.toLowerCase()

  if (destination === 'Ethereum') {
    return combinedAssets.find(
      ({ symbol: assetSymbol }) => assetSymbol?.toLowerCase() === lowerSymbol
    )
  }

  let otherAssetsMatches = otherAssets.filter(
    ({ symbol: assetSymbol }) => assetSymbol?.toLowerCase() === lowerSymbol
  )

  let nativeAssetsMatches = nativeAssets.filter(
    ({ symbol: assetSymbol }) => assetSymbol?.toLowerCase() === lowerSymbol
  )

  const isPolkadotXcm =
    !isRelayChain(node) &&
    node !== 'Ethereum' &&
    getDefaultPallet(node as TNodePolkadotKusama) === 'PolkadotXcm'

  if (otherAssetsMatches.length === 0 && nativeAssetsMatches.length === 0) {
    if (lowerSymbol.startsWith('xc')) {
      // No exact matches found, and symbol starts with 'xc', try stripping 'xc'
      const strippedSymbol = symbol.substring(2)
      const strippedLowerSymbol = strippedSymbol.toLowerCase()

      otherAssetsMatches = otherAssets.filter(
        ({ symbol: assetSymbol }) => assetSymbol?.toLowerCase() === strippedLowerSymbol
      )

      nativeAssetsMatches = nativeAssets.filter(
        ({ symbol: assetSymbol }) => assetSymbol?.toLowerCase() === strippedLowerSymbol
      )

      if (node === 'Astar' || node === 'Shiden' || isPolkadotXcm) {
        return nativeAssetsMatches[0] || otherAssetsMatches[0] || null
      }

      const totalMatches = otherAssetsMatches.length + nativeAssetsMatches.length

      if (totalMatches > 1) {
        throw new InvalidCurrencyError(
          `Multiple assets found for symbol ${symbol} after stripping 'xc' prefix. Please specify by ID.`
        )
      }
    } else {
      // No matches found, and symbol does not start with 'xc', try adding 'xc' prefix
      const prefixedSymbol = `xc${symbol}`
      const prefixedLowerSymbol = prefixedSymbol.toLowerCase()

      otherAssetsMatches = otherAssets.filter(
        ({ symbol: assetSymbol }) => assetSymbol?.toLowerCase() === prefixedLowerSymbol
      )

      nativeAssetsMatches = nativeAssets.filter(
        ({ symbol: assetSymbol }) => assetSymbol?.toLowerCase() === prefixedLowerSymbol
      )

      if (node === 'Astar' || node === 'Shiden' || isPolkadotXcm) {
        return nativeAssetsMatches[0] || otherAssetsMatches[0] || null
      }

      const totalMatches = otherAssetsMatches.length + nativeAssetsMatches.length

      if (totalMatches > 1) {
        throw new InvalidCurrencyError(
          `Multiple assets found for symbol ${symbol} after adding 'xc' prefix. Please specify by ID.`
        )
      }
    }
  }

  if (node === 'Astar' || node === 'Shiden' || isPolkadotXcm) {
    return nativeAssetsMatches[0] || otherAssetsMatches[0] || null
  }

  if (otherAssetsMatches.length > 1 && !isRelayDestination) {
    throw new DuplicateAssetError(symbol)
  }

  return otherAssetsMatches[0] || nativeAssetsMatches[0] || null
}

export const findAssetById = (assets: TAsset[], assetId: TCurrency) => {
  const otherAssetsMatches = assets.filter(
    ({ assetId: currentAssetId }) => currentAssetId === assetId.toString()
  )

  if (otherAssetsMatches.length > 1) {
    throw new DuplicateAssetIdError(assetId.toString())
  }

  return assets.find(({ assetId: currentAssetId }) => currentAssetId === assetId.toString())
}
