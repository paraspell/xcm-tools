/* eslint-disable @typescript-eslint/no-explicit-any */
import { FC } from 'react';
import { ChartTooltip, LineChart } from '@mantine/charts';
import { MessageCountsByDayQuery } from '../../gql/graphql';
import { getParachainById, getParachainColor } from '../../utils/utils';

type Props = {
  counts: MessageCountsByDayQuery['messageCountsByDay'];
  showMedian?: boolean;
};

const AmountTransferredPlot: FC<Props> = ({ counts, showMedian }) => {
  // Process the live data into a chart-friendly format
  const processData = () => {
    const dataByDate = counts.reduce((acc: any, item) => {
      // Use date as the primary key
      if (!acc[item.date]) {
        acc[item.date] = { date: item.date };
      }
      // Use parachain ID or 'Total' if null as the series key
      const parachainKey = item.paraId
        ? getParachainById(item.paraId) || `ID ${item.paraId}`
        : 'Total';

      acc[item.date][parachainKey] = (acc[item.date][parachainKey] || 0) + item.messageCount;
      acc[item.date][`${parachainKey} Success`] = item.messageCountSuccess; // Assuming `messageCountSuccess` is available
      acc[item.date][`${parachainKey} Failed`] = item.messageCountFailed;
      return acc;
    }, {});

    let data = Object.values(dataByDate);

    if (showMedian) {
      data = data.map((day: any) => {
        // Collect values only from keys that contain 'Total'
        const values = Object.keys(day)
          .filter(key => !key.includes('Success') && !key.includes('Failed') && key !== 'date')
          .map(key => day[key]);

        console.log(Object.keys(day));

        if (values.length > 0) {
          values.sort((a, b) => a - b);
          const mid = Math.floor(values.length / 2);
          const medianValue =
            values.length % 2 !== 0 ? values[mid] : (values[mid - 1] + values[mid]) / 2;

          // Append the median to this day
          return { ...day, Median: medianValue };
        }
        return day; // Return day as is if no 'Total' keys
      });
    }
    return data;
  };

  const data = processData();

  // Generate series dynamically based on unique parachain IDs present in the data
  const series = Object.keys(
    counts.reduce((result: any, item) => {
      const key = item.paraId ? getParachainById(item.paraId) || `ID ${item.paraId}` : 'Total';
      result[key] = true; // Add parachain as a unique entry in result object
      return result;
    }, {})
  ).map(key => ({
    name: key,
    color: key === 'Total' ? 'blue.6' : getParachainColor(key)
  }));

  return (
    <LineChart
      w="100%"
      h="100%"
      data={data as any}
      dataKey="date"
      series={[
        ...series,
        {
          name: 'Median',
          color: 'gray.6'
        }
      ]}
      curveType="natural"
      tooltipProps={{
        content: ({ label, payload }) => {
          if (!payload || payload.length === 0) return null;
          const extendedPayload = payload.reduce((acc: any, item) => {
            if (item.name === 'Median') {
              acc.push(item);
              return acc;
            }
            const total = {
              ...item,
              name: `${item.name} Total`,
              value: item.value, // Total messages
              color: item.color
            };
            const success = {
              ...item,
              name: `${item.name} Success`,
              dataKey: `${item.name} Success`,
              payload: {
                category: `${item.name} Success`,
                [`${item.name} Success`]: item.payload[`${item.name} Success`]
              },
              value: 0, // Assuming 'success' is stored under each item's payload
              color: 'green' // Example color for success
            };
            const failed = {
              ...item,
              name: `${item.name} Failed`,
              dataKey: `${item.name} Failed`,
              payload: {
                category: `${item.name} Failed`,
                [`${item.name} Failed`]: item.payload[`${item.name} Failed`]
              },
              value: 0,
              color: 'red' // Example color for failures
            };

            // Append the new items
            acc.push(total, success, failed);
            return acc;
          }, []);

          return <ChartTooltip label={label} payload={extendedPayload} />;
        }
      }}
    />
  );
};

export default AmountTransferredPlot;
