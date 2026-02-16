import type { TLocation } from '@paraspell/sdk';
import { isRelayChain, type TAssetInfo, type TChain } from '@paraspell/sdk';
import type { TExchangeInput, TRouterAsset } from '@paraspell/xcm-router';
import { getExchangePairs } from '@paraspell/xcm-router';
import {
  getSupportedAssetsFrom,
  getSupportedAssetsTo,
} from '@paraspell/xcm-router';
import { useMemo } from 'react';

const getLabel = (asset: TAssetInfo) => {
  return `${asset.symbol} - ${'assetId' in asset ? asset.assetId : 'Location'}`;
};

const assetKeys = (asset: { location: TLocation }): string[] => {
  const keys: string[] = [];
  keys.push(JSON.stringify(asset.location));
  return keys;
};

export const useRouterCurrencyOptions = (
  from: TChain | undefined,
  exchangeChain: TExchangeInput,
  to: TChain | undefined,
  selectedFrom?: string,
  selectedTo?: string,
) => {
  const supportedAssetsFrom = useMemo(
    () => getSupportedAssetsFrom(from, exchangeChain),
    [from, exchangeChain],
  );

  const supportedAssetsTo = useMemo(
    () => getSupportedAssetsTo(exchangeChain, to),
    [exchangeChain, to],
  );

  const currencyFromMap = useMemo(
    () =>
      supportedAssetsFrom.reduce((map: Record<string, TAssetInfo>, asset) => {
        const key = `${asset.symbol}-${'assetId' in asset ? asset.assetId : 'NO_ID'}`;
        map[key] = asset;
        return map;
      }, {}),
    [supportedAssetsFrom],
  );

  const currencyToMap = useMemo(
    () =>
      supportedAssetsTo.reduce((map: Record<string, TRouterAsset>, asset) => {
        const key = `${asset.symbol}-${'assetId' in asset ? asset.assetId : 'NO_ID'}`;
        map[key] = asset;
        return map;
      }, {}),
    [supportedAssetsTo],
  );

  const adjacency = useMemo(() => {
    const map = new Map<string, Set<string>>();

    getExchangePairs(exchangeChain).forEach(([a, b]) => {
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
  }, [exchangeChain]);

  const currencyFromOptions = useMemo(() => {
    return Object.keys(currencyFromMap).flatMap((key) => {
      const asset = currencyFromMap[key];
      const currentKey = JSON.stringify(asset.location);

      if (selectedTo && key !== selectedFrom) {
        const toAsset = currencyToMap[selectedTo];
        if (!toAsset) return [];
        const toKey = JSON.stringify(toAsset.location ?? {});
        if (!adjacency.get(currentKey)?.has(toKey)) return [];
      }

      return [
        {
          value: key,
          label: getLabel(asset),
        },
      ];
    });
  }, [currencyFromMap, selectedTo, selectedFrom, adjacency]);

  const currencyToOptions = useMemo(() => {
    return Object.keys(currencyToMap).flatMap((key) => {
      const asset = currencyToMap[key];
      const currentKey = JSON.stringify(asset.location);

      if (selectedFrom && key !== selectedTo) {
        const fromAsset = currencyFromMap[selectedFrom];
        if (!fromAsset) return [];
        const fromKey = JSON.stringify(fromAsset.location ?? {});
        if (!adjacency.get(fromKey)?.has(currentKey)) return [];
      }

      return [
        {
          value: key,
          label: getLabel(asset),
        },
      ];
    });
  }, [currencyToMap, selectedFrom, selectedTo, adjacency]);

  const isFromNotParaToPara = from && isRelayChain(from);
  const isToNotParaToPara = to && isRelayChain(to);

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
