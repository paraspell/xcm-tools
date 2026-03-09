import type { TRouterBuilderOptions, TRouterPlan } from '../types';
import { type TBuildTransactionsOptions } from '../types';
import { buildTransactions } from './buildTransactions';
import { prepareTransformedOptions } from './utils';
import { validateTransferOptions } from './utils/validateTransferOptions';

export const buildApiTransactions = async (
  initialOptions: TBuildTransactionsOptions,
  builderOptions?: TRouterBuilderOptions,
): Promise<TRouterPlan> => {
  validateTransferOptions(initialOptions);
  const { options, dex } = await prepareTransformedOptions(initialOptions, builderOptions);
  return buildTransactions(dex, options);
};
