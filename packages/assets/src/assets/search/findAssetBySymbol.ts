import type { TNodeWithRelayChains } from '@paraspell/sdk-common'

import { InvalidCurrencyError } from '../../errors'
import { isSymbolSpecifier } from '../../guards'
import type { TAsset, TCurrencySymbolValue, TForeignAsset, TNativeAsset } from '../../types'
import { getOtherAssets } from '../assets'
import { findBestMatches } from './findBestMatches'
import { throwDuplicateAssetError } from './throwDuplicateAssetError'

export const findAssetBySymbol = (
  destination: TNodeWithRelayChains | null,
  otherAssets: TForeignAsset[],
  nativeAssets: TNativeAsset[],
  symbol: TCurrencySymbolValue
): TAsset | undefined => {
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

      if (lowerSymbol.endsWith('.e')) {
        // Symbol ends with '.e', indicating a Snowbridge asset
        const strippedSymbol = value.slice(0, -2)

        // If not found, search normal assets with '.e' suffix
        otherAssetsMatches = findBestMatches(otherAssets, value)

        if (otherAssetsMatches.length > 1) {
          throwDuplicateAssetError(value, [], otherAssetsMatches)
        } else if (otherAssetsMatches.length > 0) {
          return otherAssetsMatches[0]
        }

        if (lowerSymbol.startsWith('xc')) {
          // Symbol starts with 'xc', try stripping 'xc' prefix
          const strippedSymbol = value.substring(2)
          otherAssetsMatches = findBestMatches(otherAssets, strippedSymbol)
        } else {
          // Try adding 'xc' prefix
          const prefixedSymbol = `xc${value}`
          otherAssetsMatches = findBestMatches(otherAssets, prefixedSymbol)
        }

        if (otherAssetsMatches.length > 1) {
          throwDuplicateAssetError(value, [], otherAssetsMatches)
        } else if (otherAssetsMatches.length > 0) {
          return otherAssetsMatches[0]
        }

        // Search in Ethereum assets without the '.e' suffix
        const ethereumAssets = getOtherAssets('Ethereum')
        const ethereumMatches = findBestMatches(ethereumAssets, strippedSymbol)

        if (ethereumMatches.length > 0) {
          return ethereumMatches[0]
        }

        // If still not found, search normal assets without suffix
        otherAssetsMatches = findBestMatches(otherAssets, strippedSymbol)

        if (otherAssetsMatches.length > 1) {
          throwDuplicateAssetError(value, [], otherAssetsMatches)
        } else if (otherAssetsMatches.length > 0) {
          return otherAssetsMatches[0]
        }

        // No matches found
        return undefined
      } else {
        // Symbol does not end with '.e', proceed with existing logic
        otherAssetsMatches = findBestMatches(otherAssets, value)

        if (otherAssetsMatches.length === 0) {
          if (lowerSymbol.startsWith('xc')) {
            // Symbol starts with 'xc', try stripping 'xc' prefix
            const strippedSymbol = value.substring(2)

            otherAssetsMatches = findBestMatches(otherAssets, strippedSymbol)
          } else {
            // Try adding 'xc' prefix
            const prefixedSymbol = `xc${value}`

            otherAssetsMatches = findBestMatches(otherAssets, prefixedSymbol)
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

    if (lowerSymbol.endsWith('.e')) {
      // Symbol ends with '.e', indicating a Snowbridge asset
      const strippedSymbol = symbol.slice(0, -2)

      // If not found, search normal assets with '.e' suffix
      otherAssetsMatches = findBestMatches(otherAssets, symbol)
      nativeAssetsMatches = findBestMatches(nativeAssets, symbol)

      if (nativeAssetsMatches.length > 0 || otherAssetsMatches.length > 0) {
        return otherAssetsMatches[0] || nativeAssetsMatches[0]
      }

      if (lowerSymbol.startsWith('xc')) {
        // Symbol starts with 'xc', try stripping 'xc' prefix
        const strippedSymbol = symbol.substring(2)
        otherAssetsMatches = findBestMatches(otherAssets, strippedSymbol)
      } else {
        // Try adding 'xc' prefix
        const prefixedSymbol = `xc${symbol}`
        otherAssetsMatches = findBestMatches(otherAssets, prefixedSymbol)
      }

      if (otherAssetsMatches.length > 1) {
        throwDuplicateAssetError(symbol, [], otherAssetsMatches)
      } else if (otherAssetsMatches.length > 0) {
        return otherAssetsMatches[0]
      }

      // Search in Ethereum assets without the '.e' suffix
      const ethereumAssets = getOtherAssets('Ethereum')
      const ethereumMatches = findBestMatches(ethereumAssets, strippedSymbol)

      if (ethereumMatches.length > 0) {
        return ethereumMatches[0]
      }

      // If still not found, search normal assets without suffix
      otherAssetsMatches = findBestMatches(otherAssets, strippedSymbol)
      nativeAssetsMatches = findBestMatches(nativeAssets, strippedSymbol)

      if (nativeAssetsMatches.length > 0 || otherAssetsMatches.length > 0) {
        return otherAssetsMatches[0] || nativeAssetsMatches[0]
      }

      // No matches found
      return undefined
    } else {
      // Symbol does not end with '.e'
      otherAssetsMatches = findBestMatches(otherAssets, symbol)
      nativeAssetsMatches = findBestMatches(nativeAssets, symbol)

      if (otherAssetsMatches.length === 0 && nativeAssetsMatches.length === 0) {
        if (lowerSymbol.startsWith('xc')) {
          // Symbol starts with 'xc', try stripping 'xc' prefix
          const strippedSymbol = symbol.substring(2)

          otherAssetsMatches = findBestMatches(otherAssets, strippedSymbol)
          nativeAssetsMatches = findBestMatches(nativeAssets, strippedSymbol)

          const totalMatches = otherAssetsMatches.length + nativeAssetsMatches.length

          if (totalMatches > 1) {
            throwDuplicateAssetError(symbol, nativeAssetsMatches, otherAssetsMatches)
          }
        } else {
          // Try adding 'xc' prefix
          const prefixedSymbol = `xc${symbol}`

          otherAssetsMatches = findBestMatches(otherAssets, prefixedSymbol)
          nativeAssetsMatches = findBestMatches(nativeAssets, prefixedSymbol)

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
