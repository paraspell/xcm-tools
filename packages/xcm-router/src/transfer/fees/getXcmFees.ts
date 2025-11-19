import type {
  TBuildTransactionsOptions,
  TRouterBuilderOptions,
  TRouterXcmFeeResult,
} from '../../types';
import { getRouterFees } from '../getRouterFees';
import { prepareTransformedOptions, validateTransferOptions } from '../utils';

export const getXcmFees = async (
  initialOptions: TBuildTransactionsOptions,
  builderOptions?: TRouterBuilderOptions,
): Promise<TRouterXcmFeeResult> => {
  validateTransferOptions(initialOptions);
  const { options, dex } = await prepareTransformedOptions(initialOptions, builderOptions, true);
  return getRouterFees(dex, options);
};
