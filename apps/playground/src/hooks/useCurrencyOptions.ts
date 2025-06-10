import type { TAsset, TNodeWithRelayChains } from '@paraspell/sdk';
import { getSupportedAssets, isForeignAsset } from '@paraspell/sdk';
import { useMemo } from 'react';

export const useCurrencyOptions = (
  from: TNodeWithRelayChains,
  to: TNodeWithRelayChains,
) => {
  const isNotParaToPara =
    from === 'Polkadot' ||
    from === 'Kusama' ||
    to === 'Polkadot' ||
    to === 'Kusama';

  const supportedAssets = useMemo(
    () => getSupportedAssets(from, to),
    [from, to],
  );

  const currencyMap = useMemo(
    () =>
      supportedAssets.reduce((map: Record<string, TAsset>, asset) => {
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
        label: `${currencyMap[key].symbol} - ${isForeignAsset(currencyMap[key]) ? (currencyMap[key].assetId ?? 'Multi-location') : 'Native'}`,
      })),
    [currencyMap],
  );

  return { currencyOptions, isNotParaToPara, currencyMap };
};
