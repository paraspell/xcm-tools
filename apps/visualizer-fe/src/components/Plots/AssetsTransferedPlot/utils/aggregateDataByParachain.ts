import type { TRelaychain, TSubstrateChain } from '@paraspell/sdk';
import type { TFunction } from 'i18next';

import type { TAggregatedData, TAssetCounts } from '../../../../types/types';
import { getParachainId } from '../../../../utils/utils';

export const aggregateDataByParachain = (counts: TAssetCounts, t: TFunction): TAggregatedData[] => {
  const accumulator: Record<string, TAggregatedData> = {};
  counts.forEach(asset => {
    const paraId = asset.parachain ? getParachainId(asset.parachain as TSubstrateChain) : null;
    const parachainKey = paraId ? asset.parachain || `ID ${paraId}` : t('charts.common.total');
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
