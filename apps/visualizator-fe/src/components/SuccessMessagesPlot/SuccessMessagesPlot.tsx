/* eslint-disable @typescript-eslint/no-explicit-any */
import { FC } from 'react';
import { MessageCountsQuery } from '../../gql/graphql';
import { BarChart, ChartTooltip } from '@mantine/charts';
import { getParachainById } from '../../utils/utils';

type Props = {
  counts: MessageCountsQuery['messageCounts'];
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const getParachainByIdInternal = (id: number | null): any => {
  return id ? getParachainById(id) : 'Total';
};

const SuccessMessagesPlot: FC<Props> = ({ counts }) => {
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
        { name: 'Success', color: 'green' },
        { name: 'Failure', color: 'red' }
      ]}
      tickLine="y"
      tooltipProps={{
        content: ({ label, payload }) => (
          <ChartTooltip
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
