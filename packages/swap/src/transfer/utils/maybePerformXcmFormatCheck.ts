import type { PolkadotApi, TBypassOptions } from '@paraspell/sdk-core';
import { DryRunFailedError, isConfig } from '@paraspell/sdk-core';

import type { TBuildTransactionsOptions, TRouterPlan, TTransformedOptions } from '../../types';
import { dryRunTransactions } from '../dryRun';

const BYPASS: TBypassOptions = { sentAssetMintMode: 'bypass' };

export const maybePerformXcmFormatCheck = async <
  TApi,
  TRes,
  TSigner,
  TCustomChain extends string = never,
>(
  api: PolkadotApi<TApi, TRes, TSigner, TCustomChain>,
  options: TTransformedOptions<
    TBuildTransactionsOptions<TApi, TRes, TSigner, TCustomChain>,
    TApi,
    TRes,
    TSigner,
    TCustomChain
  >,
  routerPlan: TRouterPlan<TApi, TRes>,
) => {
  const { config } = api;
  if (!isConfig(config) || !config.xcmFormatCheck) return;

  const result = await dryRunTransactions(routerPlan, options, BYPASS, BYPASS);

  if (result.dryRunError) {
    throw new DryRunFailedError(result.dryRunError, 'XCM format check failed.');
  }
};
