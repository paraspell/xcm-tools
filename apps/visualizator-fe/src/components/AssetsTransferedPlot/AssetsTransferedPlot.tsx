import { forwardRef, type ReactNode, useMemo } from 'react';
import { aggregateDataByParachain } from './utils/aggregateDataByParachain';
import { type TAssetCounts } from '../../types/types';
import { useTranslation } from 'react-i18next';
import { generateSeries } from './utils/generateSeries';
import { BarChart } from '@mantine/charts';
import CustomChartTooltip from './CustomChartTooltip/CustomChartTooltip';

type Props = {
  counts: TAssetCounts;
};

const AssetsTransferredPlot = forwardRef<HTMLDivElement, Props>(({ counts }, ref) => {
  const { t } = useTranslation();

  const aggregatedData = useMemo(() => {
    return Object.values(aggregateDataByParachain(counts, t));
  }, [counts, t]);

  const series = useMemo(() => {
    return generateSeries(counts);
  }, [counts]);

  const transformedData = useMemo(() => {
    return aggregatedData.map(data => ({
      parachain: data.parachain,
      ...data.counts
    }));
  }, [aggregatedData]);

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
          return <CustomChartTooltip label={label as ReactNode} payload={sortedPayload} />;
        }
      }}
    />
  );
});

AssetsTransferredPlot.displayName = 'AssetsTransferredPlot';

export default AssetsTransferredPlot;
