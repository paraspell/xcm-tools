/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-explicit-any */
import type { ChartSeries, ChartTooltipProps } from '@mantine/charts';
import type { Factory } from '@mantine/core';
import {
  Anchor,
  Box,
  ColorSwatch,
  factory,
  getThemeColor,
  useMantineTheme,
  useProps,
  useStyles
} from '@mantine/core';
import type { TRelaychain, TSubstrateChain } from '@paraspell/sdk';
import dayjs from 'dayjs';
import { useTranslation } from 'react-i18next';

import { useSelectedParachain } from '../../../../context/SelectedParachain/useSelectedParachain';
import { getChainDisplayName } from '../../../../utils';
import { getParachainId } from '../../../../utils/utils';
import classes from './CustomChartTooltip.module.css';

type ChartSeriesLabels = Record<string, string | undefined>;

export function getSeriesLabels(series: ChartSeries[] | undefined): ChartSeriesLabels {
  if (!series) {
    return {};
  }

  return series.reduce<ChartSeriesLabels>((acc, item) => {
    const matchFound = item.name.search(/\./);
    if (matchFound >= 0) {
      const key = item.name.substring(matchFound + 1);
      acc[key] = item.label;
      return acc;
    }
    acc[item.name] = item.label;
    return acc;
  }, {});
}

function updateChartTooltipPayload(payload: Record<string, any>[]): Record<string, any>[] {
  return payload.map(item => {
    const matchFound = item.name.search(/\./);
    if (matchFound >= 0) {
      const newDataKey = item.name.substring(0, matchFound);
      const nestedPayload = { ...item.payload[newDataKey] };
      const shallowPayload = Object.entries(item.payload).reduce((acc, current) => {
        const [k, v] = current;
        return k === newDataKey ? acc : { ...acc, [k]: v };
      }, {});

      return {
        ...item,
        name: item.name.substring(matchFound + 1),
        payload: {
          ...shallowPayload,
          ...nestedPayload
        }
      };
    }
    return item;
  });
}

export function getFilteredChartTooltipPayload(payload: Record<string, any>[], segmentId?: string) {
  const duplicatesFilter = updateChartTooltipPayload(
    payload.filter(item => item.fill !== 'none' || !item.color)
  );

  if (!segmentId) {
    return duplicatesFilter;
  }

  return duplicatesFilter.filter(item => item.name === segmentId);
}

// IMPORTANT: read by dataKey (series key), fall back to name
function getData(item: Record<string, any>, type: 'area' | 'radial' | 'scatter') {
  if (type === 'radial' || type === 'scatter') {
    if (Array.isArray(item.value)) return item.value[1] - item.value[0];
    return item.value;
  }
  const key = (item.dataKey ?? item.name) as string;
  if (Array.isArray(item.payload[key])) return item.payload[key][1] - item.payload[key][0];
  return item.payload[key];
}

export type ChartTooltipStylesNames =
  | 'tooltip'
  | 'tooltipItem'
  | 'tooltipItemBody'
  | 'tooltipItemColor'
  | 'tooltipItemName'
  | 'tooltipItemData'
  | 'tooltipLabel'
  | 'tooltipBody';

export type ChartTooltipFactory = Factory<{
  props: ChartTooltipProps & { withTotal?: boolean };
  ref: HTMLDivElement;
  stylesNames: ChartTooltipStylesNames;
}>;

const defaultProps: Partial<ChartTooltipProps & { withTotal?: boolean }> = {
  type: 'area',
  showColor: true,
  withTotal: false
};

const getParaId = (label?: string, total?: string): number | undefined => {
  if (!label || (total && label.includes(total))) return undefined;
  return getParachainId(label as TSubstrateChain);
};

const getLinkByEcosystem = (ecosystem: TRelaychain): string => {
  return ecosystem ? `https://${ecosystem.toLowerCase()}.subscan.io/xcm_message?page=1` : '';
};

const generateExplorerLink = (
  ecosystem: TRelaychain,
  from: number | undefined,
  startDate: Date | null,
  endDate: Date | null
) => {
  const baseUrl = getLinkByEcosystem(ecosystem);
  const fromChain = from ? `&fromChain=${from}` : '';
  const timeDimension = startDate || endDate ? '&time_dimension=date' : '';
  const start = startDate ? `&date_start=${dayjs(startDate).format('YYYY-MM-DD')}` : '';
  const end = endDate ? `&date_end=${dayjs(endDate).format('YYYY-MM-DD')}` : '';
  return `${baseUrl}${timeDimension}${fromChain}${start}${end}`;
};

const ChartTooltip = factory<ChartTooltipFactory>((_props, ref) => {
  const props = useProps('ChartTooltip', defaultProps, _props);
  const {
    classNames,
    className,
    style,
    styles,
    unstyled,
    vars,
    payload,
    label,
    unit,
    type,
    segmentId,
    mod,
    series,
    valueFormatter,
    showColor,
    withTotal,
    ...others
  } = props;

  const theme = useMantineTheme();
  const { t } = useTranslation();
  const { dateRange } = useSelectedParachain();

  const getStyles = useStyles<ChartTooltipFactory>({
    name: 'ChartTooltip',
    classes,
    props,
    className,
    style,
    classNames,
    styles,
    unstyled
  });

  if (!payload) {
    return null;
  }

  let filteredPayload = getFilteredChartTooltipPayload(payload, segmentId);
  const scatterLabel = type === 'scatter' ? payload[0]?.payload?.name : null;
  const labels = getSeriesLabels(series);
  const _label = label || scatterLabel;

  if (withTotal && filteredPayload.length > 0) {
    const datum = filteredPayload[0]?.payload ?? {};
    const total = (datum.success ?? 0) + (datum.failed ?? 0);

    const totalRow = {
      ...filteredPayload[0],
      name: 'total',
      dataKey: 'total',
      value: total,
      payload: { ...datum, total },
      color: 'var(--mantine-color-blue-filled)',
      fill: 'var(--mantine-color-blue-filled)',
      stroke: 'var(--mantine-color-blue-filled)',
      fillOpacity: 1,
      strokeOpacity: 0
    };

    filteredPayload = [totalRow, ...filteredPayload];
  }

  const displayNameFor = (raw: string) => {
    if (labels[raw]) return labels[raw];
    if (raw === 'success') return t('status.success');
    if (raw === 'failed') return t('status.failed');
    if (raw === 'total') return t('charts.common.total');
    return raw;
  };

  const items = filteredPayload.map(item => {
    const swatchColor =
      (typeof item.color === 'string' && item.color) ||
      (typeof item.fill === 'string' && item.fill) ||
      'gray.6';

    return (
      <div key={item?.key ?? item.name} data-type={type} {...getStyles('tooltipItem')}>
        <div {...getStyles('tooltipItemBody')}>
          {showColor && (
            <ColorSwatch
              color={getThemeColor(swatchColor, theme)}
              size={12}
              {...getStyles('tooltipItemColor')}
              withShadow={false}
            />
          )}
          <div {...getStyles('tooltipItemName')}>{displayNameFor(item.name)}</div>
        </div>
        <div {...getStyles('tooltipItemData')}>
          {typeof valueFormatter === 'function'
            ? valueFormatter(getData(item, type!))
            : getData(item, type!)}
          {unit || item.unit}
        </div>
      </div>
    );
  });

  const paraId = getParaId(label as string, t('charts.common.total'));
  const ecosystem = filteredPayload[0]?.payload.ecosystem;
  const [startDate, endDate] = dateRange;
  const explorerLink = generateExplorerLink(ecosystem, paraId, startDate, endDate);

  return (
    <Box
      {...getStyles('tooltip')}
      mod={[{ type }, mod]}
      ref={ref}
      {...others}
      onMouseMove={e => e.stopPropagation()}
    >
      {_label && <div {...getStyles('tooltipLabel')}>{getChainDisplayName(_label)}</div>}
      <div {...getStyles('tooltipBody')}>
        {items}
        <Box mt={4}>
          <Anchor size="xs" href={explorerLink} target="_blank" rel="noreferrer">
            {t('main.actions.showInExplorer')}
          </Anchor>
        </Box>
      </div>
    </Box>
  );
});

ChartTooltip.displayName = '@mantine/charts/ChartTooltip';

export default ChartTooltip;
