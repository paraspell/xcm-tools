import type { TAssetInfo, TChain } from '@paraspell/sdk';
import { getSupportedAssetsImpl, isRelayChain } from '@paraspell/sdk';
import { useMemo } from 'react';

import { useCustomChains } from './useCustomChains';

export const useCurrencyOptions = (from: TChain, to: TChain) => {
  const isNotParaToPara = isRelayChain(from) || isRelayChain(to);

  const { customChainAssets } = useCustomChains();

  const supportedAssets = useMemo(
    () => getSupportedAssetsImpl(from, to, { customChainAssets }),
    [from, to, customChainAssets],
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

  return { currencyOptions, isNotParaToPara, currencyMap };
};
