import type { TGetXcmFeeResult, TXcmFeeDetail, TXcmFeeHopInfo } from '@paraspell/sdk';

type TWithExchange<T> = T & {
  isExchange?: boolean;
};

export type TRouterXcmFeeHopInfo = TWithExchange<TXcmFeeHopInfo>;

export type TRouterXcmFeeDetail = TWithExchange<TXcmFeeDetail>;

export type TRouterXcmFeeResult = TGetXcmFeeResult & {
  origin: TRouterXcmFeeDetail;
  destination: TRouterXcmFeeDetail;
  hops: TRouterXcmFeeHopInfo[];
};
