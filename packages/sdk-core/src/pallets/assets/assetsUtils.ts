// Contains function for getting Asset ID or Symbol used in XCM call creation

import { DuplicateAssetError, DuplicateAssetIdError, InvalidCurrencyError } from '../../errors'
import type {
  TAsset,
  TCurrency,
  TNativeAsset,
  TNodeWithRelayChains,
  TForeignAsset,
  TCurrencySymbolValue
} from '../../types'
import { isSymbolSpecifier } from '../../utils/assets/isSymbolSpecifier'
import { getOtherAssets } from './assets'

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
    const aliases = foreignMatches.map(asset => `${asset.alias} (ID:${asset.assetId})`).join(', ')
    throw new DuplicateAssetError(
      `Multiple foreign assets found for symbol ${symbol}. Please specify with ForeignAbstract() selector. Available aliases: ${aliases}`
    )
  }
}

export const findBestMatches = (
  assets: TAsset[],
  value: string,
  property: 'symbol' | 'alias' = 'symbol'
): TAsset[] => {
  // First, exact match
  let matches = assets.filter(asset => asset[property] === value)
  if (matches.length > 0) {
    return matches
  }

  // Uppercase match
  const upperValue = value.toUpperCase()
  matches = assets.filter(asset => asset[property] === upperValue)
  if (matches.length > 0) {
    return matches
  }

  // Lowercase match
  const lowerValue = value.toLowerCase()
  matches = assets.filter(asset => asset[property] === lowerValue)
  if (matches.length > 0) {
    return matches
  }

  // Case-insensitive match
  matches = assets.filter(asset => asset[property]?.toLowerCase() === lowerValue)
  return matches
}

export const findAssetBySymbol = (
  node: TNodeWithRelayChains,
  destination: TNodeWithRelayChains | null,
  otherAssets: TForeignAsset[],
  nativeAssets: TNativeAsset[],
  symbol: TCurrencySymbolValue
): TAsset | undefined => {
  const supportsESuffix =
    node === 'AssetHubPolkadot' ||
    node === 'AssetHubKusama' ||
    destination === 'AssetHubPolkadot' ||
    destination === 'AssetHubKusama' ||
    node === 'Ethereum'

  const isSpecifier = isSymbolSpecifier(symbol)
  let assetsMatches: TAsset[] = []

  if (isSpecifier) {
    const { type, value } = symbol

    if (type === 'Native') {
      assetsMatches = findBestMatches(nativeAssets, value, 'symbol')
    } else if (type === 'Foreign') {
      const lowerSymbol = value.toLowerCase()

      let otherAssetsMatches: TForeignAsset[] = []

      if (destination === 'Ethereum') {
        const ethereumAssets = getOtherAssets('Ethereum')

        let assetsMatches = findBestMatches(ethereumAssets, value)

        if (assetsMatches.length === 0) {
          if (lowerSymbol.endsWith('.e')) {
            // Symbol ends with '.e', strip it and search again
            const strippedSymbol = value.slice(0, -2).toLowerCase()
            assetsMatches = findBestMatches(ethereumAssets, strippedSymbol)
          } else {
            // Symbol does not end with '.e', add '.e' suffix and search
            const suffixedSymbol = `${value}.e`.toLowerCase()
            assetsMatches = findBestMatches(ethereumAssets, suffixedSymbol)
          }
        }

        return assetsMatches[0]
      }

      if (lowerSymbol.endsWith('.e') && supportsESuffix) {
        // Symbol ends with '.e', indicating a Snowbridge asset
        const strippedSymbol = value.slice(0, -2)

        // Search in Ethereum assets without the '.e' suffix
        const ethereumAssets = getOtherAssets('Ethereum')
        const ethereumMatches = findBestMatches(ethereumAssets, strippedSymbol)

        if (ethereumMatches.length > 0) {
          return ethereumMatches[0]
        }

        // If not found, search normal assets with '.e' suffix
        otherAssetsMatches = findBestMatches(otherAssets, value) as TForeignAsset[]

        if (otherAssetsMatches.length > 1) {
          throwDuplicateAssetError(value, [], otherAssetsMatches)
        } else if (otherAssetsMatches.length > 0) {
          return otherAssetsMatches[0]
        }

        // If still not found, search normal assets without suffix
        otherAssetsMatches = findBestMatches(otherAssets, strippedSymbol) as TForeignAsset[]

        if (otherAssetsMatches.length > 1) {
          throwDuplicateAssetError(value, [], otherAssetsMatches)
        } else if (otherAssetsMatches.length > 0) {
          return otherAssetsMatches[0]
        }

        // No matches found
        return undefined
      } else {
        // Symbol does not end with '.e', proceed with existing logic
        otherAssetsMatches = findBestMatches(otherAssets, value) as TForeignAsset[]

        if (otherAssetsMatches.length === 0) {
          if (lowerSymbol.startsWith('xc')) {
            // Symbol starts with 'xc', try stripping 'xc' prefix
            const strippedSymbol = value.substring(2)

            otherAssetsMatches = findBestMatches(otherAssets, strippedSymbol) as TForeignAsset[]
          } else {
            // Try adding 'xc' prefix
            const prefixedSymbol = `xc${value}`

            otherAssetsMatches = findBestMatches(otherAssets, prefixedSymbol) as TForeignAsset[]
          }
        }

        if (otherAssetsMatches.length > 1) {
          throwDuplicateAssetError(value, [], otherAssetsMatches)
        }

        return otherAssetsMatches[0] || undefined
      }
    } else if (type === 'ForeignAbstract') {
      assetsMatches = findBestMatches(otherAssets, value, 'alias')
      if (assetsMatches.length === 0) {
        throw new InvalidCurrencyError(
          `No matches found for abstract foreign asset alias ${value}.`
        )
      }
    }
  } else {
    const lowerSymbol = symbol.toLowerCase()

    let otherAssetsMatches: TForeignAsset[] = []
    let nativeAssetsMatches: TNativeAsset[] = []

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
      otherAssetsMatches = findBestMatches(otherAssets, symbol) as TForeignAsset[]
      nativeAssetsMatches = findBestMatches(nativeAssets, symbol) as TNativeAsset[]

      if (nativeAssetsMatches.length > 0 || otherAssetsMatches.length > 0) {
        return otherAssetsMatches[0] || nativeAssetsMatches[0]
      }

      // If still not found, search normal assets without suffix
      otherAssetsMatches = findBestMatches(otherAssets, strippedSymbol) as TForeignAsset[]
      nativeAssetsMatches = findBestMatches(nativeAssets, strippedSymbol) as TNativeAsset[]

      if (nativeAssetsMatches.length > 0 || otherAssetsMatches.length > 0) {
        return otherAssetsMatches[0] || nativeAssetsMatches[0]
      }

      // No matches found
      return undefined
    } else {
      // Symbol does not end with '.e'
      otherAssetsMatches = findBestMatches(otherAssets, symbol) as TForeignAsset[]
      nativeAssetsMatches = findBestMatches(nativeAssets, symbol) as TNativeAsset[]

      if (otherAssetsMatches.length === 0 && nativeAssetsMatches.length === 0) {
        if (lowerSymbol.startsWith('xc')) {
          // Symbol starts with 'xc', try stripping 'xc' prefix
          const strippedSymbol = symbol.substring(2)

          otherAssetsMatches = findBestMatches(otherAssets, strippedSymbol) as TForeignAsset[]
          nativeAssetsMatches = findBestMatches(nativeAssets, strippedSymbol) as TNativeAsset[]

          const totalMatches = otherAssetsMatches.length + nativeAssetsMatches.length

          if (totalMatches > 1) {
            throwDuplicateAssetError(symbol, nativeAssetsMatches, otherAssetsMatches)
          }
        } else {
          // Try adding 'xc' prefix
          const prefixedSymbol = `xc${symbol}`

          otherAssetsMatches = findBestMatches(otherAssets, prefixedSymbol) as TForeignAsset[]
          nativeAssetsMatches = findBestMatches(nativeAssets, prefixedSymbol) as TNativeAsset[]

          const totalMatches = otherAssetsMatches.length + nativeAssetsMatches.length

          if (totalMatches > 1) {
            throwDuplicateAssetError(symbol, nativeAssetsMatches, otherAssetsMatches)
          }
        }
      }

      const totalMatches = otherAssetsMatches.length + nativeAssetsMatches.length

      if (totalMatches > 1) {
        throwDuplicateAssetError(symbol, nativeAssetsMatches, otherAssetsMatches)
      }

      return otherAssetsMatches[0] || nativeAssetsMatches[0] || undefined
    }
  }

  return assetsMatches[0] || undefined
}

export const findAssetById = (assets: TForeignAsset[], assetId: TCurrency) => {
  const otherAssetsMatches = assets.filter(
    ({ assetId: currentAssetId }) => currentAssetId === assetId.toString()
  )

  if (otherAssetsMatches.length > 1) {
    throw new DuplicateAssetIdError(assetId.toString())
  }

  return assets.find(({ assetId: currentAssetId }) => currentAssetId === assetId.toString())
}
