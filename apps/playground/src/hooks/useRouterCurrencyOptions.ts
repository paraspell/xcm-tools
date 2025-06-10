import { type TAsset, type TNodeWithRelayChains } from '@paraspell/sdk';
import type { TExchangeInput, TRouterAsset } from '@paraspell/xcm-router';
import { getExchangePairs } from '@paraspell/xcm-router';
import {
  getSupportedAssetsFrom,
  getSupportedAssetsTo,
} from '@paraspell/xcm-router';
import { useMemo } from 'react';

const pairKey = (
  asset: Pick<TRouterAsset | TAsset, 'symbol' | 'multiLocation'>,
) => (asset.multiLocation ? JSON.stringify(asset.multiLocation) : asset.symbol);

const assetKeys = (
  asset: Pick<TRouterAsset | TAsset, 'symbol' | 'multiLocation'>,
): string[] => {
  const keys: string[] = [];
  if (asset.multiLocation) keys.push(JSON.stringify(asset.multiLocation));
  if (asset.symbol) keys.push(asset.symbol);
  return keys;
};

export const useRouterCurrencyOptions = (
  from: TNodeWithRelayChains | undefined,
  exchangeNode: TExchangeInput,
  to: TNodeWithRelayChains | undefined,
  selectedFrom?: string,
  selectedTo?: string,
) => {
  const supportedAssetsFrom = useMemo(
    () => getSupportedAssetsFrom(from, exchangeNode),
    [from, exchangeNode],
  );

  const supportedAssetsTo = useMemo(
    () => getSupportedAssetsTo(exchangeNode, to),
    [exchangeNode, to],
  );

  const currencyFromMap = useMemo(
    () =>
      supportedAssetsFrom.reduce((map: Record<string, TAsset>, asset) => {
        const key = `${asset.symbol ?? 'NO_SYMBOL'}-${'assetId' in asset ? asset.assetId : 'NO_ID'}`;
        map[key] = asset;
        return map;
      }, {}),
    [supportedAssetsFrom],
  );

  const currencyToMap = useMemo(
    () =>
      supportedAssetsTo.reduce((map: Record<string, TRouterAsset>, asset) => {
        const key = `${asset.symbol ?? 'NO_SYMBOL'}-${'assetId' in asset ? asset.assetId : 'NO_ID'}`;
        map[key] = asset;
        return map;
      }, {}),
    [supportedAssetsTo],
  );

  const adjacency = useMemo(() => {
    const map = new Map<string, Set<string>>();

    getExchangePairs(exchangeNode).forEach(([a, b]) => {
      const keysA = assetKeys(a);
      const keysB = assetKeys(b);

      keysA.forEach((kA) => {
        keysB.forEach((kB) => {
          if (kA === kB) return;
          if (!map.has(kA)) map.set(kA, new Set());
          if (!map.has(kB)) map.set(kB, new Set());
          map.get(kA)!.add(kB);
          map.get(kB)!.add(kA);
        });
      });
    });

    return map;
  }, [exchangeNode]);

  const currencyFromOptions = useMemo(() => {
    return Object.keys(currencyFromMap).flatMap((key) => {
      const asset = currencyFromMap[key];
      const currentKey = pairKey(asset);

      if (selectedTo && key !== selectedFrom) {
        const toKey = pairKey(currencyToMap[selectedTo] ?? {});
        if (!adjacency.get(currentKey)?.has(toKey)) return [];
      }

      return [
        {
          value: key,
          label: `${asset.symbol} - ${
            'assetId' in asset || 'multiLocation' in asset
              ? 'assetId' in asset
                ? asset.assetId
                : 'Multi-Location'
              : 'Native'
          }`,
        },
      ];
    });
  }, [currencyFromMap, selectedTo, selectedFrom, adjacency]);

  const currencyToOptions = useMemo(() => {
    return Object.keys(currencyToMap).flatMap((key) => {
      const asset = currencyToMap[key];
      const currentKey = pairKey(asset);

      if (selectedFrom && key !== selectedTo) {
        const fromKey = pairKey(currencyFromMap[selectedFrom] ?? {});
        if (!adjacency.get(fromKey)?.has(currentKey)) return [];
      }

      return [
        {
          value: key,
          label: `${asset.symbol} - ${
            'assetId' in asset || 'multiLocation' in asset
              ? 'assetId' in asset
                ? asset.assetId
                : 'Multi-location'
              : 'Native'
          }`,
        },
      ];
    });
  }, [currencyToMap, selectedFrom, selectedTo, adjacency]);

  const isFromNotParaToPara = from === 'Polkadot' || from === 'Kusama';
  const isToNotParaToPara = to === 'Polkadot' || to === 'Kusama';

  return {
    currencyFromOptions,
    currencyToOptions,
    currencyFromMap,
    currencyToMap,
    isFromNotParaToPara,
    isToNotParaToPara,
    adjacency,
  };
};
