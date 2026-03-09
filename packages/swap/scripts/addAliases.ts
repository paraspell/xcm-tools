import { TAssetsRecord, TExchangeChain } from '../src/types';

const collectDuplicateSymbolsInChains = (
  assetsMap: TAssetsRecord,
): {
  [chain: string]: { [symbol: string]: string[] };
} => {
  const chainDuplicates: { [chain: string]: { [symbol: string]: string[] } } = {};

  for (const chain in assetsMap) {
    const chainData = assetsMap[chain as TExchangeChain];
    const symbolToAssetKeys: { [symbol: string]: Set<string> } = {};

    const allAssets = chainData.assets || [];
    for (const asset of allAssets) {
      const symbol = asset.symbol;
      const assetKey = asset.assetId ?? JSON.stringify(asset.location);

      if (symbol && assetKey) {
        if (!symbolToAssetKeys[symbol]) {
          symbolToAssetKeys[symbol] = new Set();
        }
        symbolToAssetKeys[symbol].add(assetKey);
      }
    }

    const duplicates: { [symbol: string]: string[] } = {};
    for (const symbol in symbolToAssetKeys) {
      const assetKeys = Array.from(symbolToAssetKeys[symbol]);
      if (assetKeys.length > 1) {
        duplicates[symbol] = assetKeys;
      }
    }

    if (Object.keys(duplicates).length > 0) {
      chainDuplicates[chain] = duplicates;
    }
  }

  return chainDuplicates;
};

function assignAliasNumbers(assetKeys: string[]): { [assetKey: string]: number } {
  const aliasMapping: { [assetKey: string]: number } = {};
  const sortedAssetKeys = [...assetKeys].sort();

  sortedAssetKeys.forEach((assetKey, index) => {
    aliasMapping[assetKey] = index + 1;
  });

  return aliasMapping;
}

export const addAliasesToDuplicateSymbols = (assetsMap: TAssetsRecord): TAssetsRecord => {
  const chainDuplicates = collectDuplicateSymbolsInChains(assetsMap);

  for (const chain in chainDuplicates) {
    const duplicates = chainDuplicates[chain];

    for (const symbol in duplicates) {
      const assetKeys = duplicates[symbol];
      const aliasNumbers = assignAliasNumbers(assetKeys);

      const chainData = assetsMap[chain as TExchangeChain];
      const allAssets = chainData.assets || [];

      for (const asset of allAssets) {
        if (asset.symbol === symbol) {
          const assetKey = asset.assetId ?? JSON.stringify(asset.location);
          const aliasNumber = aliasNumbers[assetKey];

          if (aliasNumber !== undefined) {
            asset.alias = `${symbol}${aliasNumber}`;
          }
        }
      }
    }
  }

  return assetsMap;
};
