import type { AssetCountsBySymbolQuery } from '../gql/graphql';

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
  amounts: { [symbol: string]: number };
};

export enum Ecosystem {
  POLKADOT = 'Polkadot',
  KUSAMA = 'Kusama',
  WESTEND = 'Westend',
  PASEO = 'Paseo'
}

export type TWalletAccount = {
  address: string;
  meta: {
    name?: string;
    source?: string;
  };
};
