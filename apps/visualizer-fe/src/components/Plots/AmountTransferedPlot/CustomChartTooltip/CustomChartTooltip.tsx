/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-explicit-any */
import type { ChartSeries, ChartTooltipProps } from '@mantine/charts';
import type { Factory } from '@mantine/core';
import {
  ActionIcon,
  Anchor,
  Box,
  ColorSwatch,
  factory,
  getThemeColor,
  Group,
  useMantineTheme,
  useProps,
  useStyles
} from '@mantine/core';
import type { TRelaychain, TSubstrateChain } from '@paraspell/sdk';
import { IconX } from '@tabler/icons-react';
import dayjs from 'dayjs';
import type { MouseEvent } from 'react';
import { useTranslation } from 'react-i18next';

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
        ecosystem: item.ecosystem,
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
  props: ChartTooltipProps & {
    onCloseClick: () => void;
  };
  ref: HTMLDivElement;
  stylesNames: ChartTooltipStylesNames;
}>;

const defaultProps: Partial<ChartTooltipProps> = {
  type: 'area',
  showColor: true
};

const getParaId = (label?: string, total?: string): number | undefined => {
  if (!label || (total && label.includes(total))) return undefined;
  return getParachainId(label as TSubstrateChain);
};

const getLinkByEcosystem = (ecosystem: TRelaychain): string => {
  return `https://${ecosystem.toLowerCase()}.subscan.io/xcm_message?page=1`;
};

const generateExplorerLink = (ecosystem: TRelaychain, from: number | undefined, date: string) => {
  const baseUrl = getLinkByEcosystem(ecosystem);
  const fromChain = from ? `&fromChain=${from}` : '';
  const start = `&date_start=${dayjs(date).format('YYYY-MM-DD')}`;
  const end = `&date_end=${dayjs(date).format('YYYY-MM-DD')}`;
  return `${baseUrl}&time_dimension=date${fromChain}${start}${end}`;
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
    onCloseClick,
    ...others
  } = props;

  const theme = useMantineTheme();
  const { t } = useTranslation();

  if (!payload) {
    return null;
  }

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

  const filteredPayload = getFilteredChartTooltipPayload(payload, segmentId);
  const scatterLabel = type === 'scatter' ? payload[0]?.payload?.name : null;
  const labels = getSeriesLabels(series);
  const _label = label || scatterLabel;

  const groups: Record<string, any[]> = {};

  filteredPayload.forEach(item => {
    const parachainName = item.name === 'Median' ? 'Median' : item.parachain;

    if (!groups[parachainName]) {
      groups[parachainName] = [];
    }
    groups[parachainName].push(item);
  });

  const items = [];

  for (const [parachainName, groupItems] of Object.entries(groups)) {
    groupItems.forEach(item => {
      items.push(
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
              {getChainDisplayName(labels[item.name] || item.name)}
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

    let paraId;
    if (
      parachainName !== undefined &&
      parachainName !== 'undefined' &&
      !parachainName.includes(t('charts.amounts.median')) &&
      !parachainName.includes(t('charts.common.total'))
    ) {
      paraId = getParaId(parachainName);
    }

    const ecosystem: TRelaychain = 'Polkadot';
    const explorerLink = generateExplorerLink(ecosystem, paraId, label as string);
    if (parachainName !== 'Median') {
      items.push(
        <Box mt={2} mb="xs" key={`link-${parachainName}`} className="tooltip-explorer-link">
          <Anchor size="xs" href={explorerLink} target="_blank" rel="noreferrer">
            {t('main.actions.showInExplorer')}
          </Anchor>
        </Box>
      );
    }
  }

  const onCloseClickInternal = (e: MouseEvent) => {
    onCloseClick();
    e.stopPropagation();
  };

  return (
    <Box
      {...getStyles('tooltip')}
      mod={[{ type }, mod]}
      ref={ref}
      {...others}
      onMouseMove={e => e.stopPropagation()}
    >
      {_label && (
        <Group pr="xs">
          <div {...getStyles('tooltipLabel')}>{_label}</div>
          <ActionIcon onClick={onCloseClickInternal} variant="transparent" c="black">
            <IconX size={16} />
          </ActionIcon>
        </Group>
      )}
      <div {...getStyles('tooltipBody')}>{items}</div>
    </Box>
  );
});

ChartTooltip.displayName = '@mantine/charts/ChartTooltip';

export default ChartTooltip;
