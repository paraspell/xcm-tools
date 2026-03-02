import type { TDryRunChainResult, TDryRunResult, THopInfo } from '@paraspell/sdk';

import type { TWithExchange } from './TRouter';

/** @deprecated - Use TDryRunChainResult instead. Will be removed in v13. */
export type TRouterDryRunChainResult = TWithExchange<TDryRunChainResult>;

/** @deprecated - Use THopInfo instead. Will be removed in v13. */
export type TRouterDryRunHopInfo = TWithExchange<THopInfo>;

/** @deprecated - Use TDryRunResult instead. Will be removed in v13. */
export type TRouterDryRunResult = Omit<TDryRunResult, 'origin' | 'destination' | 'hops'> & {
  origin: TRouterDryRunChainResult;
  destination?: TRouterDryRunChainResult;
  hops: TRouterDryRunHopInfo[];
};
