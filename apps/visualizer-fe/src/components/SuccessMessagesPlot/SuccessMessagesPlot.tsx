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

const getParachainByIdInternal = (id: number | null, ecosystem: Ecosystem, total: string) => {
  return id ? getParachainById(id, ecosystem) : total;
};

const SuccessMessagesPlot = forwardRef<HTMLDivElement, Props>(({ counts }, ref) => {
  const { t } = useTranslation();
  const { selectedEcosystem } = useSelectedParachain();

  const chartData = counts.map(c => ({
    category: getParachainByIdInternal(c.paraId ?? 0, selectedEcosystem, t('charts.common.total')),
    success: c.success,
    failed: c.failed
  }));

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
      dataKey="category"
      tooltipAnimationDuration={200}
      minBarSize={3}
      series={series}
      tickLine="y"
      tooltipProps={{
        content: ({ label, payload }) => (
          <CustomChartTooltip
            label={label as ReactNode}
            payload={payload ?? []}
            series={series}
            withTotal
          />
        )
      }}
    />
  );
});

SuccessMessagesPlot.displayName = 'SuccessMessagesPlot';

export default SuccessMessagesPlot;
