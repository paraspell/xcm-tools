import type { TAssetInfo, TChain } from '@paraspell/sdk';
import { getAssets } from '@paraspell/sdk';
import { useMemo } from 'react';

export const useFeeCurrencyOptions = (from: TChain) => {
  const supportedAssets = useMemo(
    () => getAssets(from).filter((asset) => asset.isFeeAsset),
    [from],
  );

  const currencyMap = useMemo(
    () =>
      supportedAssets.reduce((map: Record<string, TAssetInfo>, asset) => {
        const key = `${asset.symbol ?? 'NO_SYMBOL'}-${!asset.isNative ? asset.assetId : 'NO_ID'}`;
        map[key] = asset;
        return map;
      }, {}),
    [supportedAssets],
  );

  const currencyOptions = useMemo(
    () =>
      Object.keys(currencyMap).map((key) => ({
        value: key,
        label: `${currencyMap[key].symbol} - ${!currencyMap[key].isNative ? (currencyMap[key].assetId ?? 'Location') : 'Native'}`,
      })),
    [currencyMap],
  );

  return { currencyOptions, currencyMap };
};
