import { BarChart } from '@mantine/charts';
import type { ReactNode } from 'react';
import { forwardRef } from 'react';
import { useTranslation } from 'react-i18next';

import { useSelectedParachain } from '../../context/SelectedParachain/useSelectedParachain';
import type { MessageCountsQuery } from '../../gql/graphql';
import type { Ecosystem } from '../../types/types';
import { getParachainById } from '../../utils/utils';
import CustomChartTooltip from './CustomChartTooltip/CustomChartTooltip';

type Props = {
  counts: MessageCountsQuery['messageCounts'];
};

const getParachainByIdInternal = (id: number | null, ecosystem: Ecosystem) => {
  return id ? getParachainById(id, ecosystem) : 'Total';
};

const SuccessMessagesPlot = forwardRef<HTMLDivElement, Props>(({ counts }, ref) => {
  const { t } = useTranslation();
  const { selectedEcosystem } = useSelectedParachain();
  const chartData = counts.map(count => ({
    category: getParachainByIdInternal(count.paraId ?? 0, selectedEcosystem),
    Success: count.success,
    Failed: count.failed
  }));

  return (
    <BarChart
      ref={ref}
      w="100%"
      h="100%"
      data={chartData}
      dataKey="category"
      tooltipAnimationDuration={200}
      minBarSize={3}
      series={[
        { name: t('status.success'), color: 'green' },
        { name: t('status.failed'), color: 'red' }
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
                          (payload[1].payload as (typeof chartData)[number]).Failed
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
