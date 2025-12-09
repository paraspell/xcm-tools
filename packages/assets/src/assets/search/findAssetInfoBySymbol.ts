import { deepEqual, getJunctionValue, type TChain } from '@paraspell/sdk-common'

import { InvalidCurrencyError } from '../../errors'
import { isSymbolSpecifier } from '../../guards'
import type { TAssetInfo, TCurrencySymbolValue } from '../../types'
import { findBestMatches } from './findBestMatches'
import { throwDuplicateAssetError } from './throwDuplicateAssetError'

const removePrefix = (symbol: string) => symbol.slice(2)

const removeSuffix = (symbol: string) => symbol.slice(0, -2)

const findEthAssetBySymbol = (
  symbol: string,
  otherAssets: TAssetInfo[]
): TAssetInfo | undefined => {
  const ethCompatibleAssets = otherAssets.filter(
    asset =>
      asset.location &&
      deepEqual(getJunctionValue(asset.location, 'GlobalConsensus'), {
        Ethereum: {
          chainId: 1
        }
      })
  )
  return findBestMatches(ethCompatibleAssets, symbol)[0]
}

const findEthMatch = (symbol: string, otherAssets: TAssetInfo[]): TAssetInfo | undefined => {
  const match = findEthAssetBySymbol(symbol, otherAssets)
  if (match) return match

  const altSymbol = symbol.toLowerCase().endsWith('.e') ? removeSuffix(symbol) : `${symbol}.e`

  return findEthAssetBySymbol(altSymbol.toLowerCase(), otherAssets)
}

const findWithXcVariant = (items: TAssetInfo[], value: string): TAssetInfo[] => {
  const lower = value.toLowerCase()
  const candidate = lower.startsWith('xc') ? removePrefix(value) : `xc${value}`
  return findBestMatches(items, candidate)
}

const pickOtherOrThrow = (input: string, otherMatches: TAssetInfo[]): TAssetInfo | undefined => {
  if (otherMatches.length > 1) {
    throwDuplicateAssetError(input, [], otherMatches)
  }
  return otherMatches[0]
}

const pickAny = (native: TAssetInfo[], other: TAssetInfo[]) => {
  return other[0] ?? native[0]
}

const throwIfDuplicate = (
  input: string,
  nativeMatches: TAssetInfo[],
  otherMatches: TAssetInfo[]
) => {
  if (nativeMatches.length + otherMatches.length > 1) {
    throwDuplicateAssetError(input, nativeMatches, otherMatches)
  }
}

export const findAssetInfoBySymbol = (
  destination: TChain | null,
  otherAssets: TAssetInfo[],
  nativeAssets: TAssetInfo[],
  symbol: TCurrencySymbolValue
): TAssetInfo | undefined => {
  const isSpecifier = isSymbolSpecifier(symbol)
  let assetsMatches: TAssetInfo[] = []

  if (isSpecifier) {
    const { type, value } = symbol

    if (type === 'Native') {
      assetsMatches = findBestMatches(nativeAssets, value, 'symbol')
    } else if (type === 'Foreign') {
      const lowerSymbol = value.toLowerCase()

      let otherAssetsMatches: TAssetInfo[] = []

      if (destination === 'Ethereum') {
        return findEthMatch(value, otherAssets)
      }

      if (lowerSymbol.endsWith('.e')) {
        // Symbol ends with '.e', indicating a Snowbridge asset
        const strippedSymbol = removeSuffix(value)

        // If not found, search normal assets with '.e' suffix
        otherAssetsMatches = findBestMatches(otherAssets, value)

        let foundAsset = pickOtherOrThrow(value, otherAssetsMatches)
        if (foundAsset) return foundAsset

        otherAssetsMatches = findWithXcVariant(otherAssets, value)

        foundAsset = pickOtherOrThrow(value, otherAssetsMatches)
        if (foundAsset) return foundAsset

        const ethAsset = findEthAssetBySymbol(strippedSymbol, otherAssets)
        if (ethAsset) return ethAsset

        // If still not found, search normal assets without suffix
        otherAssetsMatches = findBestMatches(otherAssets, strippedSymbol)

        return pickOtherOrThrow(value, otherAssetsMatches)
      } else {
        // Symbol does not end with '.e', proceed with existing logic
        otherAssetsMatches = findBestMatches(otherAssets, value)

        if (otherAssetsMatches.length === 0) {
          otherAssetsMatches = findWithXcVariant(otherAssets, value)
        }

        return pickOtherOrThrow(value, otherAssetsMatches)
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

    let otherAssetsMatches: TAssetInfo[] = []
    let nativeAssetsMatches: TAssetInfo[] = []

    if (destination === 'Ethereum') {
      return findEthMatch(symbol, otherAssets)
    }

    if (lowerSymbol.endsWith('.e')) {
      // Symbol ends with '.e', indicating a Snowbridge asset
      const strippedSymbol = removeSuffix(symbol)

      // If not found, search normal assets with '.e' suffix
      otherAssetsMatches = findBestMatches(otherAssets, symbol)
      nativeAssetsMatches = findBestMatches(nativeAssets, symbol)

      if (nativeAssetsMatches.length > 0 || otherAssetsMatches.length > 0) {
        return pickAny(nativeAssetsMatches, otherAssetsMatches)
      }

      otherAssetsMatches = findWithXcVariant(otherAssets, symbol)

      const foundAsset = pickOtherOrThrow(symbol, otherAssetsMatches)
      if (foundAsset) return foundAsset

      // Search in Ethereum assets without the '.e' suffix
      const ethAsset = findEthAssetBySymbol(strippedSymbol, otherAssets)
      if (ethAsset) return ethAsset

      // If still not found, search normal assets without suffix
      otherAssetsMatches = findBestMatches(otherAssets, strippedSymbol)
      nativeAssetsMatches = findBestMatches(nativeAssets, strippedSymbol)

      return pickAny(nativeAssetsMatches, otherAssetsMatches)
    } else {
      // Symbol does not end with '.e'
      otherAssetsMatches = findBestMatches(otherAssets, symbol)
      nativeAssetsMatches = findBestMatches(nativeAssets, symbol)

      if (otherAssetsMatches.length === 0 && nativeAssetsMatches.length === 0) {
        otherAssetsMatches = findWithXcVariant(otherAssets, symbol)
        nativeAssetsMatches = findWithXcVariant(nativeAssets, symbol)
        throwIfDuplicate(symbol, nativeAssetsMatches, otherAssetsMatches)
      }

      throwIfDuplicate(symbol, nativeAssetsMatches, otherAssetsMatches)

      return pickAny(nativeAssetsMatches, otherAssetsMatches)
    }
  }

  return assetsMatches[0]
}
