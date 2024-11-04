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
import { getOtherAssets } from './assets'

export const findAssetBySymbol = (
  node: TNodeWithRelayChains,
  destination: TNodeWithRelayChains | undefined,
  otherAssets: TAssetDetails[],
  nativeAssets: TNativeAssetDetails[],
  symbol: string,
  isRelayDestination: boolean
) => {
  const lowerSymbol = symbol.toLowerCase()

  const isPolkadotXcm =
    !isRelayChain(node) &&
    node !== 'Ethereum' &&
    getDefaultPallet(node as TNodePolkadotKusama) === 'PolkadotXcm'

  let otherAssetsMatches: TAssetDetails[] = []
  let nativeAssetsMatches: TNativeAssetDetails[] = []

  if (destination === 'Ethereum') {
    const ethereumAssets = getOtherAssets('Ethereum')

    let asset = ethereumAssets.find(
      ({ symbol: assetSymbol }) => assetSymbol?.toLowerCase() === lowerSymbol
    )

    if (!asset) {
      if (lowerSymbol.endsWith('.e')) {
        // Symbol ends with '.e', strip it and search again
        const strippedSymbol = symbol.slice(0, -2).toLowerCase()
        asset = ethereumAssets.find(
          ({ symbol: assetSymbol }) => assetSymbol?.toLowerCase() === strippedSymbol
        )
      } else {
        // Symbol does not end with '.e', add '.e' suffix and search
        const suffixedSymbol = `${symbol}.e`.toLowerCase()
        asset = ethereumAssets.find(
          ({ symbol: assetSymbol }) => assetSymbol?.toLowerCase() === suffixedSymbol
        )
      }
    }

    return asset
  }

  const supportsESuffix =
    node === 'AssetHubPolkadot' ||
    node === 'AssetHubKusama' ||
    destination === 'AssetHubPolkadot' ||
    destination === 'AssetHubKusama' ||
    node === 'Ethereum'

  if (lowerSymbol.endsWith('.e') && supportsESuffix) {
    // Symbol ends with '.e', indicating a Snowbridge asset
    const strippedSymbol = symbol.slice(0, -2)
    const strippedLowerSymbol = strippedSymbol.toLowerCase()

    // Search in Ethereum assets without the '.e' suffix
    const ethereumAsset = getOtherAssets('Ethereum').find(
      asset => asset.symbol?.toLowerCase() === strippedLowerSymbol
    )

    if (ethereumAsset) {
      return ethereumAsset
    }

    // If not found, search normal assets with '.e' suffix
    const suffixedLowerSymbol = lowerSymbol

    otherAssetsMatches = otherAssets.filter(
      ({ symbol: assetSymbol }) => assetSymbol?.toLowerCase() === suffixedLowerSymbol
    )

    nativeAssetsMatches = nativeAssets.filter(
      ({ symbol: assetSymbol }) => assetSymbol?.toLowerCase() === suffixedLowerSymbol
    )

    if (nativeAssetsMatches.length > 0 || otherAssetsMatches.length > 0) {
      if (isPolkadotXcm) {
        return nativeAssetsMatches[0] || otherAssetsMatches[0]
      }
      return otherAssetsMatches[0] || nativeAssetsMatches[0]
    }

    // If still not found, search normal assets without suffix
    otherAssetsMatches = otherAssets.filter(
      ({ symbol: assetSymbol }) => assetSymbol?.toLowerCase() === strippedLowerSymbol
    )

    nativeAssetsMatches = nativeAssets.filter(
      ({ symbol: assetSymbol }) => assetSymbol?.toLowerCase() === strippedLowerSymbol
    )

    if (nativeAssetsMatches.length > 0 || otherAssetsMatches.length > 0) {
      if (isPolkadotXcm) {
        return nativeAssetsMatches[0] || otherAssetsMatches[0]
      }
      return otherAssetsMatches[0] || nativeAssetsMatches[0]
    }

    // No matches found
    return undefined
  } else {
    // Symbol does not end with '.e', proceed with existing logic

    otherAssetsMatches = otherAssets.filter(
      ({ symbol: assetSymbol }) => assetSymbol?.toLowerCase() === lowerSymbol
    )

    nativeAssetsMatches = nativeAssets.filter(
      ({ symbol: assetSymbol }) => assetSymbol?.toLowerCase() === lowerSymbol
    )

    if (otherAssetsMatches.length === 0 && nativeAssetsMatches.length === 0) {
      if (lowerSymbol.startsWith('xc')) {
        // Symbol starts with 'xc', try stripping 'xc' prefix
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
        // Try adding 'xc' prefix
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
