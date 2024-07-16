import { AssetCountsBySymbolQuery } from '../gql/graphql';

export type ChartDataItem = {
  name: string;
  value: number;
};

export interface CustomPoint extends Highcharts.Point {
  name: string;
  value: number;
}

export type TAssetCounts = AssetCountsBySymbolQuery['assetCountsBySymbol'];

export type TAggregatedData = {
  parachain: string;
  counts: { [symbol: string]: number };
};
