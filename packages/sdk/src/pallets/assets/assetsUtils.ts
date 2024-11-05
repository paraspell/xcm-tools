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

const findBestMatches = (assets: TAsset[], symbol: string): TAsset[] => {
  // First, exact match
  let matches = assets.filter(asset => asset.symbol === symbol)
  if (matches.length > 0) {
    return matches
  }

  // Uppercase match
  const upperSymbol = symbol.toUpperCase()
  matches = assets.filter(asset => asset.symbol === upperSymbol)
  if (matches.length > 0) {
    return matches
  }

  // Lowercase match
  const lowerSymbol = symbol.toLowerCase()
  matches = assets.filter(asset => asset.symbol === lowerSymbol)
  if (matches.length > 0) {
    return matches
  }

  // Case-insensitive match
  matches = assets.filter(asset => asset.symbol?.toLowerCase() === lowerSymbol)
  return matches
}

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

    let assetsMatches = findBestMatches(ethereumAssets, symbol)

    if (assetsMatches.length === 0) {
      if (lowerSymbol.endsWith('.e')) {
        // Symbol ends with '.e', strip it and search again
        const strippedSymbol = symbol.slice(0, -2).toLowerCase()
        assetsMatches = findBestMatches(ethereumAssets, strippedSymbol)
      } else {
        // Symbol does not end with '.e', add '.e' suffix and search
        const suffixedSymbol = `${symbol}.e`.toLowerCase()
        assetsMatches = findBestMatches(ethereumAssets, suffixedSymbol)
      }
    }

    return assetsMatches[0]
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

    // Search in Ethereum assets without the '.e' suffix
    const ethereumAssets = getOtherAssets('Ethereum')
    const ethereumMatches = findBestMatches(ethereumAssets, strippedSymbol)

    if (ethereumMatches.length > 0) {
      return ethereumMatches[0]
    }

    // If not found, search normal assets with '.e' suffix
    otherAssetsMatches = findBestMatches(otherAssets, symbol) as TAssetDetails[]
    nativeAssetsMatches = findBestMatches(nativeAssets, symbol) as TNativeAssetDetails[]

    if (nativeAssetsMatches.length > 0 || otherAssetsMatches.length > 0) {
      if (isPolkadotXcm) {
        return nativeAssetsMatches[0] || otherAssetsMatches[0]
      }
      return otherAssetsMatches[0] || nativeAssetsMatches[0]
    }

    // If still not found, search normal assets without suffix
    otherAssetsMatches = findBestMatches(otherAssets, strippedSymbol) as TAssetDetails[]
    nativeAssetsMatches = findBestMatches(nativeAssets, strippedSymbol) as TNativeAssetDetails[]

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
    otherAssetsMatches = findBestMatches(otherAssets, symbol) as TAssetDetails[]
    nativeAssetsMatches = findBestMatches(nativeAssets, symbol) as TNativeAssetDetails[]

    if (otherAssetsMatches.length === 0 && nativeAssetsMatches.length === 0) {
      if (lowerSymbol.startsWith('xc')) {
        // Symbol starts with 'xc', try stripping 'xc' prefix
        const strippedSymbol = symbol.substring(2)

        otherAssetsMatches = findBestMatches(otherAssets, strippedSymbol) as TAssetDetails[]
        nativeAssetsMatches = findBestMatches(nativeAssets, strippedSymbol) as TNativeAssetDetails[]

        if (node === 'Astar' || node === 'Shiden' || isPolkadotXcm) {
          return nativeAssetsMatches[0] || otherAssetsMatches[0] || undefined
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

        otherAssetsMatches = findBestMatches(otherAssets, prefixedSymbol) as TAssetDetails[]
        nativeAssetsMatches = findBestMatches(nativeAssets, prefixedSymbol) as TNativeAssetDetails[]

        if (node === 'Astar' || node === 'Shiden' || isPolkadotXcm) {
          return nativeAssetsMatches[0] || otherAssetsMatches[0] || undefined
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
      return nativeAssetsMatches[0] || otherAssetsMatches[0] || undefined
    }

    if (otherAssetsMatches.length > 1 && !isRelayDestination) {
      throw new DuplicateAssetError(symbol)
    }

    return otherAssetsMatches[0] || nativeAssetsMatches[0] || undefined
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
