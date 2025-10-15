import type { TDryRunChainResult, TDryRunResult, THopInfo } from '@paraspell/sdk';

import type { TWithExchange } from './TRouter';

export type TRouterDryRunChainResult = TWithExchange<TDryRunChainResult>;

export type TRouterDryRunHopInfo = TWithExchange<THopInfo>;

export type TRouterDryRunResult = Omit<TDryRunResult, 'origin' | 'destination' | 'hops'> & {
  origin: TRouterDryRunChainResult;
  destination?: TRouterDryRunChainResult;

  hops: TRouterDryRunHopInfo[];
};
