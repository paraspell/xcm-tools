import { forwardRef, ReactNode } from 'react';
import { MessageCountsQuery } from '../../gql/graphql';
import { BarChart } from '@mantine/charts';
import { getParachainById } from '../../utils/utils';
import { useTranslation } from 'react-i18next';
import { Ecosystem } from '../../types/types';
import CustomChartTooltip from './CustomChartTooltip/CustomChartTooltip';

type Props = {
  counts: MessageCountsQuery['messageCounts'];
};

const getParachainByIdInternal = (id: number | null) => {
  return id ? getParachainById(id, Ecosystem.POLKADOT) : 'Total';
};

const SuccessMessagesPlot = forwardRef<HTMLDivElement, Props>(({ counts }, ref) => {
  const { t } = useTranslation();
  const chartData = counts.map(count => ({
    category: getParachainByIdInternal(count.paraId ?? 0),
    Success: count.success,
    Failure: count.failed
  }));

  return (
    <BarChart
      ref={ref}
      w="100%"
      h="100%"
      data={chartData}
      dataKey="category"
      tooltipAnimationDuration={200}
      series={[
        { name: t('success'), color: 'green' },
        { name: t('failure'), color: 'red' }
      ]}
      tickLine="y"
      tooltipProps={{
        content: ({ label, payload }) => (
          <CustomChartTooltip
            label={label as ReactNode}
            payload={
              payload && payload.length > 0
                ? [
                    {
                      className: 'mantine-BarChart-bar',
                      style: {},
                      name: 'Total',
                      fill: 'var(--mantine-color-blue-filled)',
                      stroke: 'var(--mantine-color-blue-filled)',
                      fillOpacity: 1,
                      strokeOpacity: 0,
                      dataKey: 'Total',
                      color: 'var(--mantine-color-blue-filled)',
                      value: 0,
                      payload: {
                        category: 'Total',
                        Success: 558651,
                        Total:
                          (payload[0].payload as (typeof chartData)[number]).Success +
                          (payload[1].payload as (typeof chartData)[number]).Failure
                      },
                      hide: false
                    },
                    ...payload
                  ]
                : []
            }
          />
        )
      }}
    />
  );
});

SuccessMessagesPlot.displayName = 'SuccessMessagesPlot';

export default SuccessMessagesPlot;
