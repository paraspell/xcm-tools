import type { IconProps } from '@tabler/icons-react';
import type { FC } from 'react';
import type { Web3 } from 'web3';

import type { ASSET_QUERIES, PALLETS_QUERIES } from './consts';

export type TAssetsQuery = (typeof ASSET_QUERIES)[number];

export type TPalletsQuery = (typeof PALLETS_QUERIES)[number];

export type TEthBridgeApiResponse = {
  token: string;
  destinationParaId: number;
  destinationFee: string;
  amount: string;
  fee: string;
};

type ValueType<T> = T extends Map<unknown, infer V> ? V : never;
export type EIP6963ProviderDetail = ValueType<
  Awaited<ReturnType<typeof Web3.requestEIP6963Providers>>
>;

export type TApiType = 'PJS' | 'PAPI';

export type TWalletAccount = {
  address: string;
  meta: {
    name?: string;
    source?: string;
  };
};

export type TExtension = {
  id: string;
  name: string;
};

export type TNavItem = {
  label: string;
  url: string;
  Icon: FC<IconProps>;
};

export type TSubmitType =
  | 'default'
  | 'update'
  | 'delete'
  | 'dryRun'
  | 'getXcmFee'
  | 'getOriginXcmFee'
  | 'getXcmFeeEstimate'
  | 'getOriginXcmFeeEstimate'
  | 'getTransferableAmount'
  | 'verifyEdOnDestination'
  | 'getTransferInfo'
  | 'addToBatch';

export type TEvmSubmitType = 'default' | 'approve' | 'deposit';

export type TRouterSubmitType = 'default' | 'getBestAmountOut' | 'getXcmFee';
