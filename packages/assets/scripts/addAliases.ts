import { TNode } from '@paraspell/sdk-common'
import { TAssetJsonMap, isForeignAsset } from '../src'

function collectDuplicateSymbolsInChains(assetsMap: TAssetJsonMap): {
  [node: string]: { [symbol: string]: string[] }
} {
  const chainDuplicates: { [node: string]: { [symbol: string]: string[] } } = {}

  for (const node in assetsMap) {
    const nodeData = assetsMap[node as TNode]
    const symbolToAssetKeys: { [symbol: string]: Set<string> } = {}

    const allAssets = [...(nodeData.nativeAssets || []), ...(nodeData.otherAssets || [])]
    for (const asset of allAssets) {
      const symbol = asset.symbol
      let assetKey = ''
      if (isForeignAsset(asset)) {
        assetKey = asset.assetId ?? JSON.stringify(asset.multiLocation)
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
          const assetKey = asset.assetId ?? JSON.stringify(asset.multiLocation)
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
