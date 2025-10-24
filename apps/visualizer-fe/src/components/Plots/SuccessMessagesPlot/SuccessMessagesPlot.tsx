import { BarChart } from '@mantine/charts';
import type { ReactNode } from 'react';
import { forwardRef } from 'react';
import { useTranslation } from 'react-i18next';

import type { MessageCountsQuery } from '../../../gql/graphql';
import { getChainDisplayName } from '../../../utils';
import { formatNumber } from '../utils';
import CustomChartTooltip from './CustomChartTooltip/CustomChartTooltip';

type Props = {
  counts: MessageCountsQuery['messageCounts'];
};

const SuccessMessagesPlot = forwardRef<HTMLDivElement, Props>(({ counts }, ref) => {
  const { t } = useTranslation();

  const chartData = counts.map(c => {
    const name = c.parachain ?? t('charts.common.total');
    return {
      label: getChainDisplayName(name),
      ecosystem: c.ecosystem,
      category: name,
      success: c.success,
      failed: c.failed
    };
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
