import type { TFunction } from 'i18next';

import { useSelectedParachain } from '../../../context/SelectedParachain/useSelectedParachain';
import type { TAggregatedData, TAssetCounts } from '../../../types/types';
import { getParachainById } from '../../../utils/utils';

export const aggregateDataByParachain = (counts: TAssetCounts, t: TFunction): TAggregatedData[] => {
  const accumulator: Record<string, TAggregatedData> = {};
  const { selectedEcosystem } = useSelectedParachain();
  counts.forEach(asset => {
    const parachainKey = asset.paraId
      ? getParachainById(asset.paraId, selectedEcosystem) || `ID ${asset.paraId}`
      : t('total');
    if (!accumulator[parachainKey]) {
      accumulator[parachainKey] = { parachain: parachainKey, counts: {} };
    }
    const currentCount = accumulator[parachainKey].counts[asset.symbol] || 0;
    accumulator[parachainKey].counts[asset.symbol] = currentCount + asset.count;
  });

  return Object.values(accumulator);
};
