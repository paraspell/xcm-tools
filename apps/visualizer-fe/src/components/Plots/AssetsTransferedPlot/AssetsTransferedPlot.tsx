import { BarChart } from '@mantine/charts';
import type { ReactNode } from 'react';
import { forwardRef, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { useSelectedParachain } from '../../../context/SelectedParachain/useSelectedParachain';
import type { TAssetCounts } from '../../../types/types';
import { formatNumber } from '../utils';
import CustomChartTooltip from './CustomChartTooltip/CustomChartTooltip';
import { aggregateDataByParachain } from './utils/aggregateDataByParachain';
import { generateSeries } from './utils/generateSeries';

type Props = {
  counts: TAssetCounts;
  showAmounts?: boolean;
};

const AssetsTransferredPlot = forwardRef<HTMLDivElement, Props>(({ counts, showAmounts }, ref) => {
  const { t } = useTranslation();

  const { selectedEcosystem } = useSelectedParachain();

  const aggregatedData = useMemo(() => {
    return Object.values(aggregateDataByParachain(counts, t, selectedEcosystem));
  }, [counts, t]);

  const series = useMemo(() => {
    return generateSeries(counts);
  }, [counts]);

  const transformedData = useMemo(
    () =>
      aggregatedData.map(d => ({
        parachain: d.parachain,
        ...(showAmounts ? d.amounts : d.counts)
      })),
    [aggregatedData, showAmounts]
  );

  return (
    <BarChart
      ref={ref}
      data={transformedData}
      series={series}
      type="stacked"
      dataKey="parachain"
      h="100%"
      w="100%"
      tooltipAnimationDuration={200}
      tooltipProps={{
        content: ({ label, payload }) => {
          if (!payload || payload.length === 0) return null;
          const sortedPayload = payload.sort((a, b) => b.value - a.value);
          return (
            <CustomChartTooltip
              label={label as ReactNode}
              payload={sortedPayload}
              valueFormatter={formatNumber}
            />
          );
        }
      }}
      valueFormatter={formatNumber}
    />
  );
});

AssetsTransferredPlot.displayName = 'AssetsTransferredPlot';

export default AssetsTransferredPlot;
