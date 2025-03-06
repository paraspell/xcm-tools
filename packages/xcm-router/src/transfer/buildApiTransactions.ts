import type { TRouterPlan } from '../types';
import { type TBuildTransactionsOptions } from '../types';
import { buildTransactions } from './buildTransactions';
import { prepareTransformedOptions } from './utils';
import { validateTransferOptions } from './utils/validateTransferOptions';

export const buildApiTransactions = async (
  initialOptions: TBuildTransactionsOptions,
): Promise<TRouterPlan> => {
  validateTransferOptions(initialOptions);
  const { options, dex } = await prepareTransformedOptions(initialOptions);
  return await buildTransactions(dex, options);
};
