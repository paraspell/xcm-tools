/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { Amount, getCurrencyCombinations, Token } from '@crypto-dex-sdk/currency';
import { getAssets, getParaId, isForeignAsset, type TParachain } from '@paraspell/sdk';
import type { ApiPromise } from '@polkadot/api';

import type { TDexConfig, TPairs, TRouterAsset } from '../../../types';
import { findToken, getBestTrade, getFilteredPairs, getTokenMap } from './bifrostUtils';

export const getDexConfig = async (api: ApiPromise, chain: TParachain): Promise<TDexConfig> => {
  const chainId = getParaId(chain);

  const pairKey = (asset: TRouterAsset) =>
    (asset.location as object | undefined) ?? asset.assetId ?? asset.symbol;

  const tokenMap = getTokenMap(chain, chainId);
  const sdkAssets = getAssets(chain);

  const assetsMap = new Map<string, TRouterAsset>();

  Object.values(tokenMap).forEach((wrapped) => {
    const symbol = wrapped.wrapped.symbol;
    if (!symbol) return;

    const sdkAsset = sdkAssets.find((a) => a.symbol.toLowerCase() === symbol.toLowerCase());

    if (!sdkAsset) return;

    assetsMap.set(symbol, {
      symbol,
      assetId: isForeignAsset(sdkAsset) ? sdkAsset.assetId : undefined,
      location: sdkAsset.location,
      decimals: sdkAsset.decimals,
    });
  });

  const assets = Array.from(assetsMap.values());

  const pairEntries = await api.query.zenlinkProtocol.pairStatuses.entries();

  const tokensList = Object.values(tokenMap);
  const pairs: TPairs = [];
  const seen = new Set<string>();

  const findTokenByDesc = (d: { chainId: number; assetType: number; assetIndex: number }) =>
    tokensList.find((tok: any) => {
      const info = tok.wrapped.tokenInfo;
      return (
        info.parachainId === d.chainId &&
        info.assetType === d.assetType &&
        info.assetIndex === d.assetIndex
      );
    });

  pairEntries.forEach(
    ([
      {
        args: [keys],
      },
    ]) => {
      const [assetAData, assetBData] = keys.toJSON() as any[];

      const tokA = findTokenByDesc(assetAData);
      const tokB = findTokenByDesc(assetBData);
      if (!tokA || !tokB) return;

      const symA = tokA.wrapped.symbol as string;
      const symB = tokB.wrapped.symbol as string;
      const raA = assetsMap.get(symA);
      const raB = assetsMap.get(symB);
      if (!raA || !raB) return;

      const dedup = [symA, symB].sort().join('-');
      if (seen.has(dedup)) return;
      seen.add(dedup);

      pairs.push([pairKey(raA), pairKey(raB)]);
    },
  );

  const syntheticPairs: TPairs = [];

  for (let i = 0; i < assets.length; i++) {
    for (let j = i + 1; j < assets.length; j++) {
      const a = assets[i];
      const b = assets[j];

      const dedup = [a.symbol, b.symbol].sort().join('-');
      if (seen.has(dedup)) continue;

      const wrapA = findToken(tokenMap, a.symbol);
      const wrapB = findToken(tokenMap, b.symbol);
      if (!wrapA || !wrapB) continue;

      const tokA = new Token(wrapA.wrapped);
      const tokB = new Token(wrapB.wrapped);

      try {
        const combos = getCurrencyCombinations(chainId, tokA, tokB);
        const filtered = await getFilteredPairs(api, chainId, combos);

        const minUnit = Amount.fromRawAmount(tokA, '1');
        getBestTrade(chainId, filtered, minUnit, tokB);

        syntheticPairs.push([pairKey(a), pairKey(b)]);
        seen.add(dedup);
      } catch {
        /* no route ⇒ skip */
      }
    }
  }

  return {
    isOmni: false,
    assets,
    pairs: [...pairs, ...syntheticPairs],
  };
};
