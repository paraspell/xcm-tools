import type { TGetXcmFeeResult, TXcmFeeDetail } from '@paraspell/sdk';

export type TRouterXcmFeeResult = {
  sendingChain?: TGetXcmFeeResult;
  exchangeChain: TXcmFeeDetail;
  receivingChain?: TGetXcmFeeResult;
};
