import type { PolkadotApi, TAssetInfo, TDryRunResult } from '@paraspell/sdk-core';
import { DryRunFailedError } from '@paraspell/sdk-core';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { TBuildTransactionsOptions, TRouterPlan, TTransformedOptions } from '../../types';
import { dryRunTransactions } from '../dryRun';
import { maybePerformXcmFormatCheck } from './maybePerformXcmFormatCheck';

vi.mock('../dryRun');

const createApi = (config: unknown): PolkadotApi<unknown, unknown, unknown> =>
  ({ config }) as unknown as PolkadotApi<unknown, unknown, unknown>;

const options = {} as TTransformedOptions<
  TBuildTransactionsOptions<unknown, unknown, unknown>,
  unknown,
  unknown,
  unknown
>;

const routerPlan = [{ tx: {}, chain: 'Acala' }] as TRouterPlan<unknown, unknown>;

const dryRunRes = (overrides: Partial<TDryRunResult> = {}): TDryRunResult => ({
  origin: {
    success: true,
    fee: 0n,
    forwardedXcms: null,
    asset: {} as TAssetInfo,
  },
  hops: [],
  ...overrides,
});

describe('maybePerformXcmFormatCheck', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('does nothing when config is undefined', async () => {
    await maybePerformXcmFormatCheck(createApi(undefined), options, routerPlan);
    expect(dryRunTransactions).not.toHaveBeenCalled();
  });

  it('does nothing when config is a url string', async () => {
    await maybePerformXcmFormatCheck(createApi('wss://example'), options, routerPlan);
    expect(dryRunTransactions).not.toHaveBeenCalled();
  });

  it('does nothing when xcmFormatCheck is not set', async () => {
    await maybePerformXcmFormatCheck(createApi({ development: true }), options, routerPlan);
    expect(dryRunTransactions).not.toHaveBeenCalled();
  });

  it('does nothing when xcmFormatCheck is false', async () => {
    await maybePerformXcmFormatCheck(createApi({ xcmFormatCheck: false }), options, routerPlan);
    expect(dryRunTransactions).not.toHaveBeenCalled();
  });

  it('runs dryRunTransactions with bypass on both legs when xcmFormatCheck is true', async () => {
    vi.mocked(dryRunTransactions).mockResolvedValue(dryRunRes());

    await maybePerformXcmFormatCheck(createApi({ xcmFormatCheck: true }), options, routerPlan);

    expect(dryRunTransactions).toHaveBeenCalledTimes(1);
    expect(dryRunTransactions).toHaveBeenCalledWith(
      routerPlan,
      options,
      { sentAssetMintMode: 'bypass' },
      { sentAssetMintMode: 'bypass' },
    );
  });

  it('throws DryRunFailedError with reason and failure chain when dry run fails', async () => {
    vi.mocked(dryRunTransactions).mockResolvedValue(
      dryRunRes({ failureReason: 'BadFormat', failureChain: 'origin' }),
    );

    await expect(
      maybePerformXcmFormatCheck(createApi({ xcmFormatCheck: true }), options, routerPlan),
    ).rejects.toBeInstanceOf(DryRunFailedError);

    await expect(
      maybePerformXcmFormatCheck(createApi({ xcmFormatCheck: true }), options, routerPlan),
    ).rejects.toMatchObject({
      reason: 'BadFormat',
      dryRunType: 'origin',
      message: 'XCM format check failed. Dry run on origin failed: BadFormat',
    });
  });

  it('does not throw when dry run result has no failureReason', async () => {
    vi.mocked(dryRunTransactions).mockResolvedValue(dryRunRes());

    await expect(
      maybePerformXcmFormatCheck(createApi({ xcmFormatCheck: true }), options, routerPlan),
    ).resolves.toBeUndefined();
  });
});
