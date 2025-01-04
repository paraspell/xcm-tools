import type { ASSET_QUERIES, PALLETS_QUERIES } from './consts';
import type { Web3 } from 'web3';

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

export type WalletAccount = {
  address: string;
  meta: {
    name?: string;
    source?: string;
  };
};
