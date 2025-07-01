import {
  dryRunOrigin,
  type TDryRunNodeResult,
  type TPapiApi,
  type TPapiTransaction,
} from '@paraspell/sdk';
import BigNumber from 'bignumber.js';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { DRY_RUN_FEE_BUFFER } from '../consts';
import { calculateTxFeeDryRun } from './calculateTxFeeDryRun';

vi.mock('@paraspell/sdk', async () => {
  const actual = await vi.importActual('@paraspell/sdk');
  return {
    ...actual,
    dryRunOrigin: vi.fn(),
  };
});

describe('calculateTxFeeDryRun', () => {
  const api = {} as unknown as TPapiApi;
  const node = 'BifrostPolkadot';
  const tx = {} as unknown as TPapiTransaction;
  const address = 'test-address';

  afterEach(() => {
    vi.resetAllMocks();
  });

  it('should return multiplied fee when dry run is successful', async () => {
    const fee = 100;
    const resultFromDryRun = {
      success: true,
      fee,
      failureReason: '',
    } as unknown as TDryRunNodeResult;
    const getDryRunSpy = vi.mocked(dryRunOrigin).mockResolvedValueOnce(resultFromDryRun);
    const expectedFee = new BigNumber(fee.toString()).multipliedBy(DRY_RUN_FEE_BUFFER);
    const result = await calculateTxFeeDryRun(api, node, tx, address);
    expect(getDryRunSpy).toHaveBeenCalledWith({
      api,
      node,
      tx,
      address,
    });
    expect(result.isEqualTo(expectedFee)).toBe(true);
  });

  it('should throw an error when dry run fails', async () => {
    const failureReason = 'some error';
    const resultFromDryRun = { success: false, fee: 0, failureReason } as TDryRunNodeResult;
    vi.mocked(dryRunOrigin).mockResolvedValueOnce(resultFromDryRun);
    await expect(calculateTxFeeDryRun(api, node, tx, address)).rejects.toThrow(
      `Failed to calculate fee using dry run. Node: ${node} Error: ${failureReason}`,
    );
  });
});
