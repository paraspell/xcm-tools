import type { TBuildTransactionsOptions, TRouterXcmFeeResult } from '../../types';
import { getRouterFees } from '../getRouterFees';
import { prepareTransformedOptions, validateTransferOptions } from '../utils';

export const getXcmFees = async (
  initialOptions: TBuildTransactionsOptions,
): Promise<TRouterXcmFeeResult> => {
  validateTransferOptions(initialOptions);
  const { options, dex } = await prepareTransformedOptions(initialOptions);
  return getRouterFees(dex, options);
};
