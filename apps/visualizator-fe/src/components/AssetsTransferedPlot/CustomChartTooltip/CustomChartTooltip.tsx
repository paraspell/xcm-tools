/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Factory } from '@mantine/core';
import {
  Anchor,
  Box,
  ColorSwatch,
  factory,
  getThemeColor,
  Image,
  useMantineTheme,
  useProps,
  useStyles
} from '@mantine/core';
import classes from './CustomChartTooltip.module.css';
import type { ChartSeries, ChartTooltipProps } from '@mantine/charts';
import { getParachainId } from '../../../utils/utils';
import { Ecosystem } from '../../../types/types';
import dayjs from 'dayjs';
import { useSelectedParachain } from '../../../context/SelectedParachain/useSelectedParachain';
import subscanLogo from '../../../assets/subscan.png';

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

function getData(item: Record<string, any>, type: 'area' | 'radial' | 'scatter') {
  if (type === 'radial' || type === 'scatter') {
    if (Array.isArray(item.value)) {
      return item.value[1] - item.value[0];
    }
    return item.value;
  }

  if (Array.isArray(item.payload[item.dataKey])) {
    return item.payload[item.dataKey][1] - item.payload[item.dataKey][0];
  }
  return item.payload[item.name];
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
  props: ChartTooltipProps;
  ref: HTMLDivElement;
  stylesNames: ChartTooltipStylesNames;
}>;

const defaultProps: Partial<ChartTooltipProps> = {
  type: 'area',
  showColor: true
};

const getParaId = (label?: string): number | undefined => {
  if (!label || label === 'Total') return undefined;
  return getParachainId(label, Ecosystem.POLKADOT);
};

const generateExplorerLink = (
  from: number | undefined,
  startDate: Date | null,
  endDate: Date | null,
  symbol: string
) => {
  const baseUrl = 'https://polkadot.subscan.io/xcm_transfer?page=1';
  const fromChain = from ? `&fromChain=${from}` : '';
  const timeDimension = startDate || endDate ? '&time_dimension=date' : '';
  const start = startDate ? `&date_start=${dayjs(startDate).format('YYYY-MM-DD')}` : '';
  const end = endDate ? `&date_end=${dayjs(endDate).format('YYYY-MM-DD')}` : '';
  return `${baseUrl}${timeDimension}${fromChain}${start}${end}&symbol=${symbol}`;
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
    ...others
  } = props;

  const theme = useMantineTheme();

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

  const filteredPayload = getFilteredChartTooltipPayload(payload, segmentId);
  const scatterLabel = type === 'scatter' ? payload[0]?.payload?.name : null;
  const labels = getSeriesLabels(series);
  const _label = label || scatterLabel;

  const paraId = getParaId(label as string);

  const { dateRange } = useSelectedParachain();

  const [startDate, endDate] = dateRange;

  const items = filteredPayload.map(item => {
    const explorerLink = generateExplorerLink(paraId, startDate, endDate, item.name);
    return (
      <div key={item?.key ?? item.name} data-type={type} {...getStyles('tooltipItem')}>
        <div {...getStyles('tooltipItemBody')}>
          {showColor && (
            <ColorSwatch
              color={getThemeColor(item.color, theme)}
              size={12}
              {...getStyles('tooltipItemColor')}
              withShadow={false}
            />
          )}
          <div {...getStyles('tooltipItemName')}>
            <Anchor href={explorerLink} target="_blank" rel="noreferrer">
              {labels[item.name] || item.name}
            </Anchor>
            <Image ml="xs" src={subscanLogo} w={11} h={11} />
          </div>
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

  return (
    <Box {...getStyles('tooltip')} mod={[{ type }, mod]} ref={ref} {...others}>
      {_label && <div {...getStyles('tooltipLabel')}>{_label}</div>}
      <div {...getStyles('tooltipBody')}>{items}</div>
    </Box>
  );
});

ChartTooltip.displayName = '@mantine/charts/ChartTooltip';

export default ChartTooltip;
