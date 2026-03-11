import type { TExchangeChain, TExchangeInput } from '@paraspell/sdk';

export const resolveExchange = (
  exchange: TExchangeChain[] | undefined,
): TExchangeInput => {
  if (!exchange || exchange.length === 0) {
    return undefined;
  }

  if (exchange.length === 1) {
    return exchange[0];
  }

  return exchange as [TExchangeChain, ...TExchangeChain[]];
};
