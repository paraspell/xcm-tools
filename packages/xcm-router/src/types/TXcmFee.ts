import type { TGetXcmFeeResult, TXcmFeeDetail, TXcmFeeHopInfo } from '@paraspell/sdk';

import type { TWithExchange } from './TRouter';

/** @deprecated - Use TConditionalXcmFeeHopInfo instead. Will be removed in v13. */
export type TRouterXcmFeeHopInfo = TWithExchange<TXcmFeeHopInfo>;

/** @deprecated - Use TConditionalXcmFeeDetail instead. Will be removed in v13. */
export type TRouterXcmFeeDetail = TWithExchange<TXcmFeeDetail>;

/** @deprecated - Use TGetXcmFeeResult instead. Will be removed in v13. */
export type TRouterXcmFeeResult = TGetXcmFeeResult & {
  origin: TRouterXcmFeeDetail;
  destination: TRouterXcmFeeDetail;
  hops: TRouterXcmFeeHopInfo[];
};
