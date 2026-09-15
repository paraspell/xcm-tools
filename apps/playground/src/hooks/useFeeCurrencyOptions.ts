import type { TAssetInfo, TChain } from '@paraspell/sdk';
import { getAssetsImpl, isAssetEqual, isExternalChain } from '@paraspell/sdk';
import { useMemo } from 'react';

import { useCustomChains } from './useCustomChains';

export const useFeeCurrencyOptions = (from: TChain, to: TChain) => {
  const { customChainAssets } = useCustomChains();

  const supportedAssets = useMemo(() => {
    const destFeeAssets = isExternalChain(to)
      ? []
      : getAssetsImpl(to, { customChainAssets }).filter(
          (asset) => asset.isFeeAsset,
        );

    return getAssetsImpl(from, { customChainAssets }).filter(
      (asset) =>
        asset.isFeeAsset ||
        destFeeAssets.some((feeAsset) => isAssetEqual(feeAsset, asset)),
    );
  }, [from, to, customChainAssets]);

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
