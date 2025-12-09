import { TChain } from '@paraspell/sdk-common'
import { TAssetJsonMap } from '../src'

const collectDuplicateSymbolsInChains = (
  assetsMap: TAssetJsonMap
): {
  [chain: string]: { [symbol: string]: string[] }
} => {
  const chainDuplicates: { [chain: string]: { [symbol: string]: string[] } } = {}

  for (const chain in assetsMap) {
    const chainData = assetsMap[chain as TChain]
    const symbolToAssetKeys: { [symbol: string]: Set<string> } = {}

    const allAssets = chainData.assets || []
    for (const asset of allAssets) {
      const symbol = asset.symbol
      let assetKey = ''
      if (!asset.isNative) {
        assetKey = asset.assetId ?? JSON.stringify(asset.location)
      }
      if (symbol && assetKey) {
        if (!symbolToAssetKeys[symbol]) {
          symbolToAssetKeys[symbol] = new Set()
        }
        symbolToAssetKeys[symbol].add(assetKey)
      }
    }

    const duplicates: { [symbol: string]: string[] } = {}
    for (const symbol in symbolToAssetKeys) {
      const assetIds = Array.from(symbolToAssetKeys[symbol])
      if (assetIds.length > 1) {
        duplicates[symbol] = assetIds
      }
    }

    if (Object.keys(duplicates).length > 0) {
      chainDuplicates[chain] = duplicates
    }
  }

  return chainDuplicates
}

function assignAliasNumbers(assetIds: string[]): { [assetId: string]: number } {
  const aliasMapping: { [assetId: string]: number } = {}
  const sortedAssetIds = [...assetIds].sort()

  sortedAssetIds.forEach((assetId, index) => {
    aliasMapping[assetId] = index + 1
  })

  return aliasMapping
}

export const addAliasesToDuplicateSymbols = (assetsMap: TAssetJsonMap): TAssetJsonMap => {
  const chainDuplicates = collectDuplicateSymbolsInChains(assetsMap)

  for (const chain in chainDuplicates) {
    const duplicates = chainDuplicates[chain]
    for (const symbol in duplicates) {
      const assetIds = duplicates[symbol]
      const aliasNumbers = assignAliasNumbers(assetIds)

      const chainData = assetsMap[chain as TChain]
      const allAssets = chainData.assets || []

      for (const asset of allAssets) {
        if (asset.symbol === symbol && !asset.isNative) {
          const assetKey = asset.assetId ?? JSON.stringify(asset.location)
          const aliasNumber = aliasNumbers[assetKey]
          if (aliasNumber !== undefined) {
            asset.alias = `${symbol}${aliasNumber}`
          }
        }
      }
    }
  }

  return assetsMap
}
