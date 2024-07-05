/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { FC } from 'react';
import { AssetCountsBySymbolQuery } from '../../gql/graphql';
import { getParachainById } from '../../utils/utils';
import { BarChart } from '@mantine/charts';
import { useTranslation } from 'react-i18next';

const fixedPalette = [
  '#FF6384',
  '#36A2EB',
  '#FFCE56',
  '#4BC0C0',
  '#9966FF',
  '#FF9F40',
  '#E7E9ED',
  '#70D6FF',
  '#FF70A6',
  '#FF9770',
  '#FFD670',
  '#E9FF70',
  '#8AEFFF',
  '#B5E85E',
  '#FF7575',
  '#B28DFF',
  '#FFC0CB',
  '#C0C0FF',
  '#C4FAF8',
  '#F2D7D5'
];

type Props = {
  counts: AssetCountsBySymbolQuery['assetCountsBySymbol'];
};

const AssetsTransferredPlot: FC<Props> = ({ counts }) => {
  const { t } = useTranslation();
  const processData = () => {
    const dataByParachain = counts.reduce((acc: any, item) => {
      const parachainKey = item.paraId
        ? getParachainById(item.paraId) || `ID ${item.paraId}`
        : t('total');
      if (!acc[parachainKey]) {
        acc[parachainKey] = { parachain: parachainKey };
      }
      acc[parachainKey][item.symbol] = (acc[parachainKey][item.symbol] || 0) + item.count;
      return acc;
    }, {});

    return Object.values(dataByParachain);
  };

  const data = processData();

  const symbolColors: any = {};
  counts.forEach((item: any, index) => {
    if (item.symbol && !symbolColors[item.symbol]) {
      symbolColors[item.symbol] = fixedPalette[index % fixedPalette.length];
    }
  });

  const series = Object.keys(symbolColors).map(symbol => ({
    name: symbol,
    color: symbolColors[symbol]
  }));

  return (
    <BarChart
      data={data as any}
      series={series}
      type="stacked"
      dataKey="parachain"
      h="100%"
      w="100%"
      tooltipAnimationDuration={200}
    />
  );
};

export default AssetsTransferredPlot;
