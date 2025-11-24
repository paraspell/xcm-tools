import { BarChart } from '@mantine/charts';
import type { TSubstrateChain } from '@paraspell/sdk';
import type { ReactNode } from 'react';
import { forwardRef } from 'react';
import { useTranslation } from 'react-i18next';

import { useSelectedEcosystem } from '../../../context/SelectedEcosystem/useSelectedEcosystem';
import { useSelectedParachain } from '../../../context/SelectedParachain/useSelectedParachain';
import type { MessageCountsQuery } from '../../../gql/graphql';
import { getChainDisplayName } from '../../../utils';
import { formatNumber } from '../utils';
import CustomChartTooltip from './CustomChartTooltip/CustomChartTooltip';

type Props = {
  counts: MessageCountsQuery['messageCounts'];
};

const SuccessMessagesPlot = forwardRef<HTMLDivElement, Props>(({ counts }, ref) => {
  const { t } = useTranslation();
  const { selectedParachains } = useSelectedParachain();
  const { selectedEcosystem } = useSelectedEcosystem();

  const order = new Map(selectedParachains.map((p, index) => [p, index]));
  const chartData = counts
    .map(c => {
      const name = c.parachain ?? `${t('charts.common.total')} - ${selectedEcosystem}`;
      return {
        label: getChainDisplayName(name),
        ecosystem: c.ecosystem,
        category: name,
        success: c.success,
        failed: c.failed
      };
    })
    .sort((a, b) => {
      const aIndex = order.get(a.category as TSubstrateChain) ?? Number.MAX_SAFE_INTEGER;
      const bIndex = order.get(b.category as TSubstrateChain) ?? Number.MAX_SAFE_INTEGER;
      return aIndex - bIndex;
    });

  const series = [
    { name: 'success', label: t('status.success'), color: 'green' },
    { name: 'failed', label: t('status.failed'), color: 'red' }
  ];

  return (
    <BarChart
      ref={ref}
      w="100%"
      h="100%"
      data={chartData}
      dataKey="label"
      tooltipAnimationDuration={200}
      valueFormatter={formatNumber}
      minBarSize={3}
      series={series}
      tickLine="y"
      tooltipProps={{
        content: ({ payload }) => {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
          const rawLabel = payload?.[0]?.payload?.category ?? '';
          return (
            <CustomChartTooltip
              label={rawLabel as ReactNode}
              payload={payload ?? []}
              series={series}
              valueFormatter={formatNumber}
              withTotal
            />
          );
        }
      }}
    />
  );
});

SuccessMessagesPlot.displayName = 'SuccessMessagesPlot';

export default SuccessMessagesPlot;
