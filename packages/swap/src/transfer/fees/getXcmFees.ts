import type { TGetXcmFeeResult } from '@paraspell/sdk';

import type { TBuildTransactionsOptions, TRouterBuilderOptions } from '../../types';
import { getRouterFees } from '../getRouterFees';
import { prepareTransformedOptions, validateTransferOptions } from '../utils';

export const getXcmFees = async <TDisableFallback extends boolean>(
  initialOptions: TBuildTransactionsOptions,
  disableFallback: TDisableFallback,
  builderOptions?: TRouterBuilderOptions,
): Promise<TGetXcmFeeResult<TDisableFallback>> => {
  validateTransferOptions(initialOptions);
  const { options, dex } = await prepareTransformedOptions(initialOptions, builderOptions, true);
  return getRouterFees(dex, options, disableFallback);
};
