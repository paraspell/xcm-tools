import type { IPolkadotApi } from '@paraspell/sdk-core';
import type { Extrinsic } from '@paraspell/sdk-pjs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { isPjsExtrinsic } from '../../utils';
import { convertTxToTarget } from './convertTx';

vi.mock('../../utils');

const makeTx = (hex: string) => ({ toHex: vi.fn(() => hex) }) as unknown as Extrinsic;

const makeApi = (txFromHexFn: ReturnType<typeof vi.fn>) =>
  ({
    getType: () => 'PAPI',
    txFromHex: txFromHexFn,
  }) as unknown as IPolkadotApi<unknown, unknown, unknown>;

describe('convertTxToTarget', () => {
  const RAW = '0xAABBCCDDEEFF';
  const TWO_BYTE = '0xCCDDEEFF'; // header stripped by 2 bytes
  const THREE_BYTE = '0xDDEEFF'; // header stripped by 3 bytes

  afterEach(() => vi.clearAllMocks());

  beforeEach(() => {
    vi.mocked(isPjsExtrinsic).mockReturnValue(true);
  });

  it('returns the parsed tx when the 2-byte strip succeeds', async () => {
    const resultValue = { ok: true };
    const txFromHexFn = vi.fn(() => resultValue);

    const out = await convertTxToTarget(makeTx(RAW), makeApi(txFromHexFn));

    expect(txFromHexFn).toHaveBeenCalledTimes(1);
    expect(txFromHexFn).toHaveBeenCalledWith(TWO_BYTE);
    expect(out).toBe(resultValue);
  });

  it('falls back to a 3-byte strip when the 2-byte attempt throws', async () => {
    const resultValue = { ok: 'fallback' };
    const txFromHexFn = vi
      .fn()
      .mockImplementationOnce(() => {
        throw new Error('bad header');
      })
      .mockReturnValueOnce(resultValue);

    const out = await convertTxToTarget(makeTx(RAW), makeApi(txFromHexFn));

    expect(txFromHexFn).toHaveBeenCalledTimes(2);
    expect(txFromHexFn.mock.calls[0][0]).toBe(TWO_BYTE);
    expect(txFromHexFn.mock.calls[1][0]).toBe(THREE_BYTE);
    expect(out).toBe(resultValue);
  });

  it('re-throws when parsing fails with both header lengths', async () => {
    const err = new Error('still broken');
    const txFromHexFn = vi.fn(() => {
      throw err;
    });

    await expect(convertTxToTarget(makeTx(RAW), makeApi(txFromHexFn))).rejects.toThrow(err);

    expect(txFromHexFn).toHaveBeenCalledTimes(2);
  });
});
