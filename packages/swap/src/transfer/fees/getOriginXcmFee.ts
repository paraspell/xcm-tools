import type { TXcmFeeDetailWithForwardedXcm } from '@paraspell/sdk-core';

import type { TBuildTransactionsOptions } from '../../types';
import { getSwapOriginFee } from '../getSwapOriginFee';
import { prepareTransformedOptions, validateTransferOptions } from '../utils';

export const getOriginXcmFee = async <TApi, TRes, TSigner, TDisableFallback extends boolean>(
  initialOptions: TBuildTransactionsOptions<TApi, TRes, TSigner>,
  disableFallback: TDisableFallback,
): Promise<TXcmFeeDetailWithForwardedXcm<TDisableFallback>> => {
  validateTransferOptions(initialOptions);
  const { options, dex } = await prepareTransformedOptions(initialOptions, true);
  return getSwapOriginFee(dex, options, disableFallback);
};
