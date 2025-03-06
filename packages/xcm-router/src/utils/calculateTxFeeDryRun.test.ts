import * as sdkPjs from '@paraspell/sdk-pjs';
import BigNumber from 'bignumber.js';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { DRY_RUN_FEE_BUFFER } from '../consts';
import { calculateTxFeeDryRun } from './calculateTxFeeDryRun';

describe('calculateTxFeeDryRun', () => {
  const api = {} as unknown as sdkPjs.TPjsApi;
  const node = 'BifrostPolkadot';
  const tx = {} as unknown as sdkPjs.Extrinsic;
  const address = 'test-address';

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should return multiplied fee when dry run is successful', async () => {
    const fee = 100;
    const resultFromDryRun = {
      success: true,
      fee,
      failureReason: '',
    } as unknown as sdkPjs.TDryRunResult;
    const getDryRunSpy = vi.spyOn(sdkPjs, 'getDryRun').mockResolvedValue(resultFromDryRun);
    const expectedFee = new BigNumber(fee.toString()).multipliedBy(DRY_RUN_FEE_BUFFER);
    const result = await calculateTxFeeDryRun(api, node, tx, address);
    expect(getDryRunSpy).toHaveBeenCalledWith({ api, node, tx, address });
    expect(result.isEqualTo(expectedFee)).toBe(true);
  });

  it('should throw an error when dry run fails', async () => {
    const failureReason = 'some error';
    const resultFromDryRun = { success: false, fee: 0, failureReason } as sdkPjs.TDryRunResult;
    vi.spyOn(sdkPjs, 'getDryRun').mockResolvedValue(resultFromDryRun);
    await expect(calculateTxFeeDryRun(api, node, tx, address)).rejects.toThrow(
      `Failed to calculate fee using dry run. Node: ${node} Error: ${failureReason}`,
    );
  });
});
