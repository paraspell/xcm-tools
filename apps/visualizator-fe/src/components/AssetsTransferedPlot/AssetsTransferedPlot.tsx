/* eslint-disable @typescript-eslint/no-explicit-any */

import { FC } from 'react';
import { AssetCountsBySymbolQuery } from '../../gql/graphql';
import { getParachainById } from '../../utils/utils';
import { BarChart } from '@mantine/charts';

// Expanded fixed color palette
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
  // Process the live data into a chart-friendly format
  const processData = () => {
    const dataByParachain = counts.reduce((acc: any, item) => {
      const parachainKey = item.paraId
        ? getParachainById(item.paraId) || `ID ${item.paraId}`
        : 'Total';
      if (!acc[parachainKey]) {
        acc[parachainKey] = { parachain: parachainKey };
      }
      acc[parachainKey][item.symbol] = (acc[parachainKey][item.symbol] || 0) + item.count;
      return acc;
    }, {});

    return Object.values(dataByParachain);
  };

  const data = processData();

  // Create a unique color for each symbol from the fixed palette
  const symbolColors: any = {};
  counts.forEach((item: any, index) => {
    if (item.symbol && !symbolColors[item.symbol]) {
      // Use index modulo palette length to cycle through colors
      symbolColors[item.symbol] = fixedPalette[index % fixedPalette.length];
    }
  });

  // Generate the series based on the unique asset symbols present in the data
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
