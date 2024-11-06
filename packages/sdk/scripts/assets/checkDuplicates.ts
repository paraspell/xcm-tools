import assetsMapJson from '../../src/maps/assets.json' assert { type: 'json' }
import type { TAssetJsonMap } from '../../src/types'

const assetsMap = assetsMapJson as TAssetJsonMap

const findDuplicates = () => {
  Object.entries(assetsMap).forEach(([networkName, network]) => {
    const assetSymbols = new Map<string, Record<string, number>>()

    const addSymbol = (symbol: string | undefined, type: string) => {
      if (!symbol) return // Skip if symbol is undefined
      if (!assetSymbols.has(symbol)) {
        assetSymbols.set(symbol, { nativeAssets: 0, otherAssets: 0 })
      }
      assetSymbols.get(symbol)![type] += 1
    }

    network.nativeAssets.forEach(asset => addSymbol(asset.symbol, 'nativeAssets'))
    network.otherAssets.forEach(asset => addSymbol(asset.symbol, 'otherAssets'))

    const duplicates = Array.from(assetSymbols.entries())
      .filter(
        ([_, types]) =>
          types.nativeAssets > 1 ||
          types.otherAssets > 1 ||
          (types.nativeAssets > 0 && types.otherAssets > 0)
      )
      .map(([symbol, counts]) => ({
        symbol,
        counts: `nativeAssets: ${counts.nativeAssets}, otherAssets: ${counts.otherAssets}`
      }))

    if (duplicates.length > 0) {
      console.log(`Duplicates in ${networkName}:`, duplicates)
    }
  })
}

findDuplicates()
