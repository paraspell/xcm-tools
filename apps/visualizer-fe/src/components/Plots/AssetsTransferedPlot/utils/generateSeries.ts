import type { BarChartSeries } from '@mantine/charts';

import type { TAssetCounts } from '../../../../types/types';
import { colorPallete } from '../color-pallete';

export const generateSeries = (counts: TAssetCounts): BarChartSeries[] => {
  const seenSymbols = new Set<string>();
  return counts.reduce<BarChartSeries[]>((acc, asset, index) => {
    if (!seenSymbols.has(asset.symbol)) {
      seenSymbols.add(asset.symbol);
      acc.push({
        name: asset.symbol,
        color: colorPallete[index % colorPallete.length]
      });
    }
    return acc;
  }, []);
};
