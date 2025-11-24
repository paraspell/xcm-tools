import { BarChart } from '@mantine/charts';
import type { TSubstrateChain } from '@paraspell/sdk';
import type { ReactNode } from 'react';
import { forwardRef, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { useSelectedEcosystem } from '../../../context/SelectedEcosystem/useSelectedEcosystem';
import { useSelectedParachain } from '../../../context/SelectedParachain/useSelectedParachain';
import type { TAssetCounts } from '../../../types/types';
import { getChainDisplayName } from '../../../utils';
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
  const { selectedParachains } = useSelectedParachain();
  const { selectedEcosystem } = useSelectedEcosystem();

  const aggregatedData = useMemo(() => {
    return Object.values(aggregateDataByParachain(counts, t, selectedEcosystem));
  }, [counts, t]);

  const series = useMemo(() => {
    return generateSeries(counts);
  }, [counts]);

  const transformedData = useMemo(() => {
    const order = new Map(selectedParachains.map((p, index) => [p, index]));
    return aggregatedData
      .map(d => ({
        parachain: d.parachain,
        ecosystem: d.ecosystem,
        display: getChainDisplayName(d.parachain as TSubstrateChain),
        ...(showAmounts ? d.amounts : d.counts)
      }))
      .sort((a, b) => {
        const aIndex = order.get(a.parachain as TSubstrateChain) ?? Number.MAX_SAFE_INTEGER;
        const bIndex = order.get(b.parachain as TSubstrateChain) ?? Number.MAX_SAFE_INTEGER;
        return aIndex - bIndex;
      });
  }, [aggregatedData, showAmounts, selectedParachains]);

  return (
    <BarChart
      ref={ref}
      data={transformedData}
      series={series}
      type="stacked"
      dataKey="display"
      h="100%"
      w="100%"
      tooltipAnimationDuration={200}
      tooltipProps={{
        content: ({ payload }) => {
          if (!payload || payload.length === 0) return null;
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
          const rawLabel = payload[0].payload.parachain;
          const sortedPayload = [
            ...new Map(
              payload.sort((a, b) => b.value - a.value).map(item => [item.value, item])
            ).values()
          ];
          return (
            <CustomChartTooltip
              label={rawLabel as ReactNode}
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
