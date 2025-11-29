import type { TGetXcmFeeResult, TXcmFeeDetail, TXcmFeeHopInfo } from '@paraspell/sdk';

import type { TWithExchange } from './TRouter';

export type TRouterXcmFeeHopInfo = TWithExchange<TXcmFeeHopInfo>;

export type TRouterXcmFeeDetail = TWithExchange<TXcmFeeDetail>;

// eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents
export type TRouterXcmFeeResult = TGetXcmFeeResult & {
  origin: TRouterXcmFeeDetail;
  destination: TRouterXcmFeeDetail;
  hops: TRouterXcmFeeHopInfo[];
};
