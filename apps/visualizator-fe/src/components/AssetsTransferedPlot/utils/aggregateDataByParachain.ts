import { TFunction } from 'i18next';
import { TAssetCounts, TAggregatedData } from '../../../types/types';
import { getParachainById } from '../../../utils/utils';

export const aggregateDataByParachain = (counts: TAssetCounts, t: TFunction): TAggregatedData[] => {
  const accumulator: Record<string, TAggregatedData> = {};
  counts.forEach(asset => {
    const parachainKey = asset.paraId
      ? getParachainById(asset.paraId) || `ID ${asset.paraId}`
      : t('total');
    if (!accumulator[parachainKey]) {
      accumulator[parachainKey] = { parachain: parachainKey, counts: {} };
    }
    const currentCount = accumulator[parachainKey].counts[asset.symbol] || 0;
    accumulator[parachainKey].counts[asset.symbol] = currentCount + asset.count;
  });

  return Object.values(accumulator);
};
