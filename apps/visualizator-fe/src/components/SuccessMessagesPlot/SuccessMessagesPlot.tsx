import { FC } from 'react';
import { MessageCountsQuery } from '../../gql/graphql';
import { BarChart, ChartTooltip } from '@mantine/charts';
import { getParachainById } from '../../utils/utils';
import { useTranslation } from 'react-i18next';
import { Ecosystem } from '../../types/types';

type Props = {
  counts: MessageCountsQuery['messageCounts'];
};

const getParachainByIdInternal = (id: number | null) => {
  return id ? getParachainById(id, Ecosystem.POLKADOT) : 'Total';
};

const SuccessMessagesPlot: FC<Props> = ({ counts }) => {
  const { t } = useTranslation();
  const chartData = counts.map(count => ({
    category: getParachainByIdInternal(count.paraId ?? 0),
    Success: count.success,
    Failure: count.failed
  }));

  return (
    <BarChart
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
          <ChartTooltip
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            label={label}
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
                        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
                        Total: payload[0].payload.Success + payload[1].payload.Failure
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
};

export default SuccessMessagesPlot;
