/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { FC } from 'react';
import { ChartTooltip, LineChart } from '@mantine/charts';
import { MessageCountsByDayQuery } from '../../gql/graphql';
import { getParachainById, getParachainColor } from '../../utils/utils';
import { useTranslation } from 'react-i18next';

type Props = {
  counts: MessageCountsByDayQuery['messageCountsByDay'];
  showMedian?: boolean;
};

const AmountTransferredPlot: FC<Props> = ({ counts, showMedian }) => {
  const { t } = useTranslation();
  const processData = () => {
    const dataByDate = counts.reduce((acc: any, item) => {
      if (!acc[item.date]) {
        acc[item.date] = { date: item.date };
      }
      const parachainKey = item.paraId
        ? getParachainById(item.paraId) || `ID ${item.paraId}`
        : 'Total';

      acc[item.date][parachainKey] = (acc[item.date][parachainKey] || 0) + item.messageCount;
      acc[item.date][`${parachainKey} Success`] = item.messageCountSuccess;
      acc[item.date][`${parachainKey} Failed`] = item.messageCountFailed;
      return acc;
    }, {});

    let data = Object.values(dataByDate);

    if (showMedian) {
      data = data.map((day: any) => {
        const values = Object.keys(day)
          .filter(key => !key.includes('Success') && !key.includes('Failed') && key !== 'date')
          .map(key => day[key]);

        if (values.length > 0) {
          values.sort((a, b) => a - b);
          const mid = Math.floor(values.length / 2);
          const medianValue =
            values.length % 2 !== 0 ? values[mid] : (values[mid - 1] + values[mid]) / 2;
          return { ...day, Median: medianValue };
        }
        return day;
      });
    }
    return data;
  };

  const data = processData();

  const series = Object.keys(
    counts.reduce((result: any, item) => {
      const key = item.paraId ? getParachainById(item.paraId) || `ID ${item.paraId}` : 'Total';
      result[key] = true;
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
          name: t('median'),
          color: 'gray.6'
        }
      ]}
      curveType="natural"
      tooltipProps={{
        content: ({ label, payload }) => {
          if (!payload || payload.length === 0) return null;
          const extendedPayload = payload.reduce((acc: any, item) => {
            if (item.name === t('median')) {
              acc.push(item);
              return acc;
            }
            const total = {
              ...item,
              name: `${item.name} ${t('total')}`,
              value: item.value,
              color: item.color
            };
            const success = {
              ...item,
              name: `${item.name} ${t('success')}`,
              dataKey: `${item.name} Success`,
              payload: {
                category: `${item.name} ${t('success')}`,
                [`${item.name} ${t('success')}`]: item.payload[`${item.name} ${t('success')}`]
              },
              value: 0,
              color: 'green'
            };
            const failed = {
              ...item,
              name: `${item.name} ${t('failed')}`,
              dataKey: `${item.name} Failed`,
              payload: {
                category: `${item.name} ${t('failed')}`,
                [`${item.name} ${t('failed')}`]: item.payload[`${item.name} ${t('failed')}`]
              },
              value: 0,
              color: 'red'
            };

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
