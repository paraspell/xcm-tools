import type { TRelaychain } from '@paraspell/sdk';
import type { TFunction } from 'i18next';

import type { TAggregatedData, TAssetCounts } from '../../../../types/types';

export const aggregateDataByParachain = (
  counts: TAssetCounts,
  t: TFunction,
  selectedEcosystem: TRelaychain
): TAggregatedData[] => {
  const accumulator: Record<string, TAggregatedData> = {};
  counts.forEach(asset => {
    const parachainKey = asset.parachain
      ? asset.parachain || `ID ${asset.parachain}`
      : `${t('charts.common.total')} - ${selectedEcosystem}`;
    if (!accumulator[parachainKey]) {
      accumulator[parachainKey] = {
        parachain: parachainKey,
        ecosystem: asset.ecosystem as TRelaychain,
        counts: {},
        amounts: {}
      };
    }
    const currentCount = accumulator[parachainKey].counts[asset.symbol] ?? 0;
    accumulator[parachainKey].counts[asset.symbol] = currentCount + asset.count;

    const currentAmount = accumulator[parachainKey].amounts[asset.symbol] ?? '0';
    accumulator[parachainKey].amounts[asset.symbol] = Number(currentAmount) + Number(asset.amount);
  });

  return Object.values(accumulator);
};
