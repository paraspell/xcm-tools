import { createApiInstanceForNode } from '@paraspell/sdk-pjs';
import type { TRouterPlan } from '../types';
import { type TBuildTransactionsOptions } from '../types';
import { prepareTransformedOptions } from './utils';
import { validateTransferOptions } from './utils/validateTransferOptions';
import { buildTransactions } from './buildTransactions';

export const buildApiTransactions = async (
  initialOptions: TBuildTransactionsOptions,
): Promise<TRouterPlan> => {
  validateTransferOptions(initialOptions);

  const { options, dex } = await prepareTransformedOptions(initialOptions);

  const { from } = options;

  const originApi = await createApiInstanceForNode(from);
  const swapApi = await dex.createApiInstance();

  try {
    return await buildTransactions(originApi, swapApi, options);
  } finally {
    await originApi.disconnect();
    await swapApi.disconnect();
  }
};
