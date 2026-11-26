import { Amount, getCurrencyCombinations, Token } from '@crypto-dex-sdk/currency';
import type { TAssetInfo } from '@paraspell/sdk-core';
import { getAssets, getParaId, isSymbolMatch, type TParachain } from '@paraspell/sdk-core';
import type { ApiPromise } from '@polkadot/api';

import type { TDexConfigStored, TPairs } from '../../../types';
import {
  findToken,
  getBestTrade,
  getFilteredPairs,
  getTokenMap,
  selectPairs,
} from './bifrostUtils';

type TZenlinkAssetId = { chainId: number; assetType: number; assetIndex: number };

const pairKey = (symbolA: string, symbolB: string) =>
  [symbolA, symbolB]
    .map((s) => s.toLowerCase())
    .sort()
    .join('-');

export const getDexConfig = async (
  api: ApiPromise,
  chain: TParachain,
): Promise<TDexConfigStored> => {
  const chainId = getParaId(chain);

  const tokenMap = getTokenMap(chain, chainId);
  const tokens = Object.values(tokenMap);
  const sdkAssets = getAssets(chain);

  const assetsMap = new Map<string, TAssetInfo>();
  tokens.forEach(({ symbol }) => {
    const sdkAsset = sdkAssets.find((a) => isSymbolMatch(a.symbol, symbol));
    if (sdkAsset) assetsMap.set(symbol, sdkAsset);
  });

  const assets = Array.from(assetsMap.values());

  const findTokenByAssetId = ({ chainId, assetType, assetIndex }: TZenlinkAssetId) =>
    tokens.find(
      ({ tokenInfo }) =>
        tokenInfo.parachainId === chainId &&
        tokenInfo.assetType === assetType &&
        tokenInfo.assetIndex === assetIndex,
    );

  const pairs: TPairs = [];
  const seen = new Set<string>();

  const pairEntries = await api.query.zenlinkProtocol.pairStatuses.entries();

  pairEntries.forEach(
    ([
      {
        args: [keys],
      },
    ]) => {
      const [assetIdA, assetIdB] = keys.toJSON() as [TZenlinkAssetId, TZenlinkAssetId];

      const tokenA = findTokenByAssetId(assetIdA);
      const tokenB = findTokenByAssetId(assetIdB);
      if (!tokenA || !tokenB) return;

      const assetA = assetsMap.get(tokenA.symbol);
      const assetB = assetsMap.get(tokenB.symbol);
      if (!assetA || !assetB) return;

      const key = pairKey(tokenA.symbol, tokenB.symbol);
      if (seen.has(key)) return;
      seen.add(key);

      pairs.push([assetA.location, assetB.location]);
    },
  );

  const candidates = [];

  for (let i = 0; i < assets.length; i++) {
    for (let j = i + 1; j < assets.length; j++) {
      const a = assets[i];
      const b = assets[j];
      if (seen.has(pairKey(a.symbol, b.symbol))) continue;

      const tokenInfoA = findToken(tokenMap, a.symbol);
      const tokenInfoB = findToken(tokenMap, b.symbol);
      if (!tokenInfoA || !tokenInfoB) continue;

      const tokenA = new Token(tokenInfoA);
      const tokenB = new Token(tokenInfoB);

      candidates.push({
        a,
        b,
        tokenA,
        tokenB,
        combos: getCurrencyCombinations(chainId, tokenA, tokenB),
      });
    }
  }

  const pools = await getFilteredPairs(
    api,
    chainId,
    candidates.flatMap(({ combos }) => combos),
  );

  const syntheticPairs: TPairs = [];

  for (const { a, b, tokenA, tokenB, combos } of candidates) {
    const key = pairKey(a.symbol, b.symbol);
    if (seen.has(key)) continue;

    try {
      getBestTrade(
        chainId,
        selectPairs(pools, chainId, combos),
        Amount.fromRawAmount(tokenA, '1'),
        tokenB,
      );

      syntheticPairs.push([a.location, b.location]);
      seen.add(key);
    } catch {
      /* no route ⇒ skip */
    }
  }

  return {
    isOmni: false,
    assets: assets.map((a) => a.location),
    pairs: [...pairs, ...syntheticPairs],
  };
};
