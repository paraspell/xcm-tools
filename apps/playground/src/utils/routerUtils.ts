import type { TExchangeChain } from '@paraspell/xcm-router';

export const getExchange = (exchange: TExchangeChain[] | undefined) => {
  if (Array.isArray(exchange)) {
    if (exchange.length === 1) {
      return exchange[0];
    }

    if (exchange.length === 0) {
      return undefined;
    }
  }

  return exchange;
};
