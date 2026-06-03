import type { ComboboxItem } from '@mantine/core';
import type { TAssetInfo, TChain } from '@paraspell/sdk';
import { useMemo } from 'react';

import { useCustomAssets } from './useCustomAssets';

export const customAssetKey = (asset: { symbol: string; assetId?: string }) =>
  `${asset.symbol}-${asset.assetId ?? 'NO_ID'}`;

export const useMergedCurrencyOptions = (
  chain: TChain,
  baseOptions: ComboboxItem[],
  baseMap: Record<string, TAssetInfo>,
) => {
  const { customAssets } = useCustomAssets();

  return useMemo(() => {
    const list = customAssets[chain] ?? [];
    const customOptions = list.map((asset) => ({
      value: customAssetKey(asset),
      label: `${asset.symbol} (custom)`,
    }));
    const customMap = Object.fromEntries(
      list.map((asset) => [customAssetKey(asset), asset]),
    );
    const optionsByKey = new Map<string, ComboboxItem>();
    for (const option of baseOptions) optionsByKey.set(option.value, option);
    for (const option of customOptions) optionsByKey.set(option.value, option);
    return {
      options: [...optionsByKey.values()],
      map: { ...baseMap, ...customMap },
    };
  }, [customAssets, chain, baseOptions, baseMap]);
};
