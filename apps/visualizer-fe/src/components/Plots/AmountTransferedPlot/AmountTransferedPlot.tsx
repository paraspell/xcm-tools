import { LineChart } from '@mantine/charts';
import type { TSubstrateChain } from '@paraspell/sdk';
import type { ReactNode } from 'react';
import { forwardRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import type { MessageCountsByDayQuery } from '../../../gql/graphql';
import { formatDate } from '../../../utils/dateFormatter';
import { getParachainColor } from '../../../utils/utils';
import { formatNumber } from '../utils';
import CustomChartTooltip from './CustomChartTooltip/CustomChartTooltip';

type Payload = {
  name: string;
  value: number;
  payload: Record<string, string | number>;
  color: string;
};

type Props = {
  counts: MessageCountsByDayQuery['messageCountsByDay'];
  showMedian?: boolean;
};

const AmountTransferredPlot = forwardRef<HTMLDivElement, Props>(({ counts, showMedian }, ref) => {
  const [isTooltipActive, setIsTooltipActive] = useState<boolean | undefined>(undefined);
  const { t } = useTranslation();

  const processData = () => {
    const dataByDate = counts.reduce<
      Record<
        string,
        {
          date: string;
          [key: string]: number | string;
        }
      >
    >((acc, item) => {
      if (!acc[item.date]) {
        acc[item.date] = { date: item.date };
      }
      const parachainKey = item.parachain
        ? item.parachain || `ID ${item.parachain}`
        : t('charts.common.total');

      acc[item.date][parachainKey] = Number(acc[item.date][parachainKey] || 0) + item.messageCount;
      acc[item.date][`${parachainKey} ${t('status.success')}`] = item.messageCountSuccess;
      acc[item.date][`${parachainKey} ${t('status.failed')}`] = item.messageCountFailed;
      return acc;
    }, {});

    let data = Object.values(dataByDate).sort((a, b) => a.date.localeCompare(b.date));

    if (showMedian) {
      data = data.map(day => {
        const values = Object.keys(day)
          .filter(
            key =>
              !key.includes(t('status.success')) &&
              !key.includes(t('status.failed')) &&
              key !== 'date'
          )
          .map(key => Number(day[key]));

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

    // format date
    data.map(day => (day.date = formatDate(day.date)));

    return data;
  };

  const data = processData();

  const series = Object.keys(
    counts.reduce<Record<string, boolean>>((result, item) => {
      const key = item.parachain
        ? item.parachain || `ID ${item.parachain}`
        : t('charts.common.total');
      result[key] = true;
      return result;
    }, {})
  ).map(key => ({
    name: key,
    color: key === t('charts.common.total') ? 'blue.6' : getParachainColor(key as TSubstrateChain)
  }));

  const onTooltipClose = () => {
    setIsTooltipActive(false);
  };

  const onChartClick = () => {
    setIsTooltipActive(undefined);
  };

  return (
    <LineChart
      ref={ref}
      w="100%"
      h="100%"
      data={data}
      dataKey="date"
      series={[
        ...series,
        {
          name: t('charts.amounts.median'),
          color: 'gray.6'
        }
      ]}
      curveType="natural"
      valueFormatter={formatNumber}
      onClick={onChartClick}
      tooltipProps={{
        trigger: 'click',
        active: isTooltipActive,
        content: ({ label, payload }) => {
          if (!payload || payload.length === 0) return null;
          const extendedPayload = (payload as Payload[]).reduce<Payload[]>((acc, item) => {
            if (item.name === t('charts.amounts.median')) {
              acc.push(item);
              return acc;
            }
            const total =
              item.name === t('charts.common.total')
                ? {
                    ...item,
                    name: item.name,
                    value: item.value,
                    color: item.color,
                    parachain: item.name
                  }
                : {
                    ...item,
                    name: `${item.name} ${t('charts.common.total')}`,
                    dataKey: item.name,
                    payload: {
                      category: `${item.name} ${t('charts.common.total')}`,
                      [`${item.name} ${t('charts.common.total')}`]: item.value
                    },
                    value: 0,
                    color: item.color,
                    parachain: item.name
                  };
            const success = {
              ...item,
              name: `${item.name} ${t('status.success')}`,
              dataKey: `${item.name} Success`,
              payload: {
                category: `${item.name} ${t('status.success')}`,
                [`${item.name} ${t('status.success')}`]:
                  item.payload[`${item.name} ${t('status.success')}`]
              },
              value: 0,
              color: 'green',
              parachain: item.name
            };
            const failed = {
              ...item,
              name: `${item.name} ${t('status.failed')}`,
              dataKey: `${item.name} Failed`,
              payload: {
                category: `${item.name} ${t('status.failed')}`,
                [`${item.name} ${t('status.failed')}`]:
                  item.payload[`${item.name} ${t('status.failed')}`]
              },
              value: 0,
              color: 'red',
              parachain: item.name
            };

            acc.push(total, success, failed);
            return acc;
          }, []);

          return (
            <CustomChartTooltip
              label={label as ReactNode}
              payload={extendedPayload}
              onCloseClick={onTooltipClose}
              valueFormatter={formatNumber}
            />
          );
        }
      }}
    />
  );
});

AmountTransferredPlot.displayName = 'AmountTransferredPlot';

export default AmountTransferredPlot;
