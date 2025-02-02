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

  const { origin, exchange } = options;

  try {
    return await buildTransactions(dex, options);
  } finally {
    if (origin) await origin.api.disconnect();
    await exchange.api.disconnect();
  }
};
