import type { TFunction } from 'i18next';

import type { TAggregatedData, TAssetCounts } from '../../../types/types';
import { Ecosystem } from '../../../types/types';
import { getParachainById } from '../../../utils/utils';

export const aggregateDataByParachain = (counts: TAssetCounts, t: TFunction): TAggregatedData[] => {
  const accumulator: Record<string, TAggregatedData> = {};
  counts.forEach(asset => {
    const parachainKey = asset.paraId
      ? getParachainById(asset.paraId, Ecosystem.POLKADOT) || `ID ${asset.paraId}`
      : t('total');
    if (!accumulator[parachainKey]) {
      accumulator[parachainKey] = { parachain: parachainKey, counts: {} };
    }
    const currentCount = accumulator[parachainKey].counts[asset.symbol] || 0;
    accumulator[parachainKey].counts[asset.symbol] = currentCount + asset.count;
  });

  return Object.values(accumulator);
};
