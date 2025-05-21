import type { TGetXcmFeeResult, TXcmFeeDetail } from '@paraspell/sdk';

import type { TExchangeNode } from './TRouter';

export type TRouterXcmFeeResult = {
  sendingChain?: TGetXcmFeeResult;
  exchangeChain: TXcmFeeDetail & { selectedExchange: TExchangeNode };
  receivingChain?: TGetXcmFeeResult;
};
