import type { TGetXcmFeeResult } from '@paraspell/sdk-core';

import type { TBuildTransactionsOptions } from '../../types';
import { getRouterFees } from '../getRouterFees';
import { prepareTransformedOptions, validateTransferOptions } from '../utils';

export const getXcmFees = async <TApi, TRes, TSigner, TDisableFallback extends boolean>(
  initialOptions: TBuildTransactionsOptions<TApi, TRes, TSigner>,
  disableFallback: TDisableFallback,
): Promise<TGetXcmFeeResult<TDisableFallback>> => {
  validateTransferOptions(initialOptions);
  const { options, dex } = await prepareTransformedOptions(initialOptions, true);
  return getRouterFees(dex, options, disableFallback);
};
