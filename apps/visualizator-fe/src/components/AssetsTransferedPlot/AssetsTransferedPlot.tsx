import { FC, ReactNode, useMemo } from 'react';
import { aggregateDataByParachain } from './utils/aggregateDataByParachain';
import { TAssetCounts } from '../../types/types';
import { useTranslation } from 'react-i18next';
import { generateSeries } from './utils/generateSeries';
import { BarChart, ChartTooltip } from '@mantine/charts';

type Props = {
  counts: TAssetCounts;
};

const AssetsTransferredPlot: FC<Props> = ({ counts }) => {
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
          return <ChartTooltip label={label as ReactNode} payload={sortedPayload} />;
        }
      }}
    />
  );
};

export default AssetsTransferredPlot;
