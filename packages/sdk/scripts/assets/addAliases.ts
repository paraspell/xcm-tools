import type { TAssetJsonMap, TNode } from '../../src/types'
import { isForeignAsset } from '../../src/utils/assets'

function collectDuplicateSymbolsInChains(assetsMap: TAssetJsonMap): {
  [node: string]: { [symbol: string]: string[] }
} {
  const chainDuplicates: { [node: string]: { [symbol: string]: string[] } } = {}

  for (const node in assetsMap) {
    const nodeData = assetsMap[node as TNode]
    const symbolToAssetIds: { [symbol: string]: Set<string> } = {}

    const allAssets = [...(nodeData.nativeAssets || []), ...(nodeData.otherAssets || [])]
    for (const asset of allAssets) {
      const symbol = asset.symbol
      const assetId = isForeignAsset(asset) ? asset.assetId : ''
      if (symbol && assetId) {
        if (!symbolToAssetIds[symbol]) {
          symbolToAssetIds[symbol] = new Set()
        }
        symbolToAssetIds[symbol].add(assetId)
      }
    }

    const duplicates: { [symbol: string]: string[] } = {}
    for (const symbol in symbolToAssetIds) {
      const assetIds = Array.from(symbolToAssetIds[symbol])
      if (assetIds.length > 1) {
        duplicates[symbol] = assetIds
      }
    }

    if (Object.keys(duplicates).length > 0) {
      chainDuplicates[node] = duplicates
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

export function addAliasesToDuplicateSymbols(assetsMap: TAssetJsonMap): TAssetJsonMap {
  const chainDuplicates = collectDuplicateSymbolsInChains(assetsMap)

  for (const node in chainDuplicates) {
    const duplicates = chainDuplicates[node]
    for (const symbol in duplicates) {
      const assetIds = duplicates[symbol]
      const aliasNumbers = assignAliasNumbers(assetIds)

      const nodeData = assetsMap[node as TNode]
      const allAssets = [...(nodeData.nativeAssets || []), ...(nodeData.otherAssets || [])]

      for (const asset of allAssets) {
        if (asset.symbol === symbol && isForeignAsset(asset)) {
          const aliasNumber = aliasNumbers[asset.assetId]
          if (aliasNumber !== undefined) {
            asset.alias = `${symbol}${aliasNumber}`
          }
        }
      }
    }
  }

  return assetsMap
}
