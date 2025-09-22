import { LineChart } from '@mantine/charts';
import type { ReactNode } from 'react';
import { forwardRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useSelectedParachain } from '../../context/SelectedParachain/useSelectedParachain';
import type { MessageCountsByDayQuery } from '../../gql/graphql';
import { getParachainById, getParachainColor } from '../../utils/utils';
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
  const { selectedEcosystem } = useSelectedParachain();
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
      const parachainKey = item.paraId
        ? getParachainById(item.paraId, selectedEcosystem) || `ID ${item.paraId}`
        : 'Total';

      acc[item.date][parachainKey] = Number(acc[item.date][parachainKey] || 0) + item.messageCount;
      acc[item.date][`${parachainKey} Success`] = item.messageCountSuccess;
      acc[item.date][`${parachainKey} Failed`] = item.messageCountFailed;
      return acc;
    }, {});

    let data = Object.values(dataByDate);

    if (showMedian) {
      data = data.map(day => {
        const values = Object.keys(day)
          .filter(key => !key.includes('Success') && !key.includes('Failed') && key !== 'date')
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
    return data;
  };

  const data = processData();

  const series = Object.keys(
    counts.reduce<Record<string, boolean>>((result, item) => {
      const key = item.paraId
        ? getParachainById(item.paraId, selectedEcosystem) || `ID ${item.paraId}`
        : 'Total';
      result[key] = true;
      return result;
    }, {})
  ).map(key => ({
    name: key,
    color: key === 'Total' ? 'blue.6' : getParachainColor(key, selectedEcosystem)
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
              item.name === 'Total'
                ? {
                    ...item,
                    name: t('charts.common.total'),
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
            />
          );
        }
      }}
    />
  );
});

AmountTransferredPlot.displayName = 'AmountTransferredPlot';

export default AmountTransferredPlot;
