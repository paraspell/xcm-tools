import type { TFunction } from 'i18next';

import type { Ecosystem, TAggregatedData, TAssetCounts } from '../../../types/types';
import { getParachainById } from '../../../utils/utils';

export const aggregateDataByParachain = (
  counts: TAssetCounts,
  t: TFunction,
  ecosystem: Ecosystem
): TAggregatedData[] => {
  const accumulator: Record<string, TAggregatedData> = {};
  counts.forEach(asset => {
    const parachainKey = asset.paraId
      ? getParachainById(asset.paraId, ecosystem) || `ID ${asset.paraId}`
      : t('charts.common.total');
    if (!accumulator[parachainKey]) {
      accumulator[parachainKey] = { parachain: parachainKey, counts: {}, amounts: {} };
    }
    const currentCount = accumulator[parachainKey].counts[asset.symbol] ?? 0;
    accumulator[parachainKey].counts[asset.symbol] = currentCount + asset.count;

    const currentAmount = accumulator[parachainKey].amounts[asset.symbol] ?? '0';
    accumulator[parachainKey].amounts[asset.symbol] = Number(currentAmount) + Number(asset.amount);
  });

  return Object.values(accumulator);
};
