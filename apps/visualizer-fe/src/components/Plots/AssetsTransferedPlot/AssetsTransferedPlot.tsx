import type { TRelaychain, TSubstrateChain } from '@paraspell/sdk';
import { getParaId } from '@paraspell/sdk';
import dayjs from 'dayjs';
import type { BarSeriesOption, EChartsOption } from 'echarts';
import { BarChart } from 'echarts/charts';
import { GridComponent, TooltipComponent } from 'echarts/components';
import * as echarts from 'echarts/core';
import { SVGRenderer } from 'echarts/renderers';
import ReactEChartsCore from 'echarts-for-react/lib/core';
import { forwardRef, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { useSelectedEcosystem } from '../../../context/SelectedEcosystem/useSelectedEcosystem';
import { useSelectedParachain } from '../../../context/SelectedParachain/useSelectedParachain';
import type { TAssetCounts } from '../../../types/types';
import { getChainDisplayName } from '../../../utils';
import { formatNumber } from '../utils';
import { colorPallete } from './color-pallete';
import { aggregateDataByParachain } from './utils/aggregateDataByParachain';

echarts.use([BarChart, GridComponent, TooltipComponent, SVGRenderer]);

type Props = {
  counts: TAssetCounts;
  showAmounts?: boolean;
};

const resolveParaId = (label: string, total: string): number | undefined => {
  if (label.includes(total)) return undefined;
  return getParaId(label as TSubstrateChain);
};

const getLinkByEcosystem = (ecosystem: TRelaychain): string =>
  `https://${ecosystem.toLowerCase()}.subscan.io/xcm_transfer?page=1`;

const generateExplorerLink = (
  ecosystem: TRelaychain,
  from: number | undefined,
  startDate: Date | null,
  endDate: Date | null,
  symbol: string
) => {
  const baseUrl = getLinkByEcosystem(ecosystem);
  const fromChain = from ? `&fromChain=${from}` : '';
  const timeDimension = startDate || endDate ? '&time_dimension=date' : '';
  const start = startDate ? `&date_start=${dayjs(startDate).format('YYYY-MM-DD')}` : '';
  const end = endDate ? `&date_end=${dayjs(endDate).format('YYYY-MM-DD')}` : '';
  return `${baseUrl}${timeDimension}${fromChain}${start}${end}&symbol=${symbol}`;
};

export const AssetsTransferredPlot = forwardRef<HTMLDivElement, Props>(
  ({ counts, showAmounts }, ref) => {
    const { t } = useTranslation();
    const { selectedParachains, dateRange } = useSelectedParachain();
    const { selectedEcosystem } = useSelectedEcosystem();

    const [startDate, endDate] = dateRange;

    const option = useMemo((): EChartsOption => {
      const aggregated = Object.values(aggregateDataByParachain(counts, t, selectedEcosystem));

      const order = new Map(selectedParachains.map((p, i) => [p, i]));
      const sorted = aggregated.sort((a, b) => {
        const aIdx = order.get(a.parachain as TSubstrateChain) ?? Number.MAX_SAFE_INTEGER;
        const bIdx = order.get(b.parachain as TSubstrateChain) ?? Number.MAX_SAFE_INTEGER;
        return aIdx - bIdx;
      });

      const categories = sorted.map(d => getChainDisplayName(d.parachain as TSubstrateChain));

      const symbolSet = new Set<string>();
      counts.forEach(a => symbolSet.add(a.symbol));
      const symbols = [...symbolSet];

      const series: BarSeriesOption[] = symbols.map((symbol, i) => ({
        name: symbol,
        type: 'bar',
        stack: 'total',
        emphasis: { focus: 'series' },
        itemStyle: { color: colorPallete[i % colorPallete.length] },
        data: sorted.map(d =>
          showAmounts ? Number(d.amounts[symbol] ?? 0) : (d.counts[symbol] ?? 0)
        )
      }));

      const ecosystems = sorted.map(d => d.ecosystem);
      const parachainNames = sorted.map(d => d.parachain);

      return {
        tooltip: {
          trigger: 'axis',
          axisPointer: { type: 'shadow' },
          confine: true,
          enterable: true,
          extraCssText: 'max-height: 400px; overflow-y: auto; pointer-events: auto;',
          formatter: params => {
            const items = params as Array<{
              seriesName: string;
              value: number;
              color: string;
              dataIndex: number;
            }>;

            if (!items.length) return '';

            const { dataIndex } = items[0];
            const parachain = parachainNames[dataIndex];
            const ecosystem = ecosystems[dataIndex];
            const paraId = resolveParaId(parachain, t('charts.common.total'));
            const displayName = getChainDisplayName(parachain);

            const sortedItems = [...items]
              .filter(i => i.value > 0)
              .sort((a, b) => b.value - a.value);

            const rows = sortedItems
              .map(item => {
                const link = generateExplorerLink(
                  ecosystem,
                  paraId,
                  startDate ?? null,
                  endDate ?? null,
                  item.seriesName
                );
                return `<div style="display:flex;justify-content:space-between;align-items:center;gap:12px;padding:2px 0;">
                  <span style="display:flex;align-items:center;gap:6px;">
                    <span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${item.color};"></span>
                    <a href="${link}" target="_blank" rel="noreferrer" style="color:inherit;text-decoration:underline;">${item.seriesName}</a>
                  </span>
                  <span style="font-weight:600;">${formatNumber(item.value)}</span>
                </div>`;
              })
              .join('');

            return `<div style="padding:4px 0;font-weight:600;margin-bottom:4px;">${displayName}</div>${rows}`;
          }
        },
        grid: {
          left: '3%',
          right: '4%',
          bottom: '3%',
          containLabel: true
        },
        xAxis: {
          type: 'category',
          data: categories,
          axisLabel: {
            rotate: categories.length > 8 ? 30 : 0,
            overflow: 'truncate',
            width: 80
          }
        },
        yAxis: {
          type: 'value',
          axisLabel: {
            formatter: (value: number) => formatNumber(value)
          }
        },
        series
      };
    }, [counts, showAmounts, selectedParachains, t, selectedEcosystem, startDate, endDate]);

    return (
      <div ref={ref} style={{ width: '100%', height: '100%' }}>
        <ReactEChartsCore
          echarts={echarts}
          option={option}
          opts={{ renderer: 'svg' }}
          style={{ width: '100%', height: '100%' }}
          notMerge
        />
      </div>
    );
  }
);

AssetsTransferredPlot.displayName = 'AssetsTransferredPlot';
