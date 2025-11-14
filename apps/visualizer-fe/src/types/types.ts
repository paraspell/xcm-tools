import type { UseOSReturnValue } from '@mantine/hooks';
import type { TRelaychain } from '@paraspell/sdk';

import type { AssetCountsBySymbolQuery } from '../gql/graphql';

export type ChartDataItem = {
  name: string;
  value: number;
};

export type CustomPoint = Highcharts.Point & {
  name: string;
  value: number;
};

export type TAssetCounts = AssetCountsBySymbolQuery['assetCountsBySymbol'];

export type TAggregatedData = {
  ecosystem: TRelaychain;
  parachain: string;
  counts: { [symbol: string]: number };
  amounts: { [symbol: string]: number };
};

export type TWalletAccount = {
  address: string;
  meta: {
    name?: string;
    source?: string;
  };
};

export type LiveXcmMsg = {
  ecosystem: TRelaychain;
  status: string;
  hash: string;
  id: string;
  originTimestamp: number;
  confirmTimestamp: number;
  from: number;
  to: number;
};

export enum DeviceType {
  Mobile = 'mobile',
  Tablet = 'tablet',
  Desktop = 'desktop'
}

export type TDeviceInfo = {
  device: DeviceType;
  os: UseOSReturnValue;
};
