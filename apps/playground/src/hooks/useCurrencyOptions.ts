import type { TAssetInfo, TChain } from '@paraspell/sdk';
import {
  getSupportedAssets,
  isForeignAsset,
  isRelayChain,
} from '@paraspell/sdk';
import { useMemo } from 'react';

export const useCurrencyOptions = (from: TChain, to: TChain) => {
  const isNotParaToPara = isRelayChain(from) || isRelayChain(to);

  const supportedAssets = useMemo(
    () => getSupportedAssets(from, to),
    [from, to],
  );

  const currencyMap = useMemo(
    () =>
      supportedAssets.reduce((map: Record<string, TAssetInfo>, asset) => {
        const key = `${asset.symbol ?? 'NO_SYMBOL'}-${isForeignAsset(asset) ? asset.assetId : 'NO_ID'}`;
        map[key] = asset;
        return map;
      }, {}),
    [supportedAssets],
  );

  const currencyOptions = useMemo(
    () =>
      Object.keys(currencyMap).map((key) => ({
        value: key,
        label: `${currencyMap[key].symbol} - ${isForeignAsset(currencyMap[key]) ? (currencyMap[key].assetId ?? 'Location') : 'Native'}`,
      })),
    [currencyMap],
  );

  return { currencyOptions, isNotParaToPara, currencyMap };
};
