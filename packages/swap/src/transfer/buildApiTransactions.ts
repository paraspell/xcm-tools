import type { TBuildTransactionsOptions, TRouterPlan } from '../types';
import { buildTransactions } from './buildTransactions';
import { prepareTransformedOptions } from './utils';
import { validateTransferOptions } from './utils/validateTransferOptions';

export const buildApiTransactions = async <TApi, TRes, TSigner>(
  initialOptions: TBuildTransactionsOptions<TApi, TRes, TSigner>,
): Promise<TRouterPlan<TApi, TRes>> => {
  validateTransferOptions(initialOptions);
  const { options, dex } = await prepareTransformedOptions(initialOptions);
  return buildTransactions(dex, options);
};
