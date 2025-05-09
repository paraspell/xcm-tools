import { Binary } from 'polkadot-api';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { convertTxToPapi } from './convertTxToPapi';

vi.mock('polkadot-api', () => {
  const fromHexMock = vi.fn((hex: string) => hex);
  return { Binary: { fromHex: fromHexMock } };
});

const makeTx = (hex: string) =>
  ({ toHex: vi.fn(() => hex) }) as unknown as import('@paraspell/sdk-pjs').Extrinsic;

const makePapi = (txFromCallData: ReturnType<typeof vi.fn>) =>
  ({
    getUnsafeApi: () => ({ txFromCallData }),
  }) as unknown as import('@paraspell/sdk').TPapiApi;

describe('convertTxToPapi', () => {
  const RAW = '0xAABBCCDDEEFF';
  const TWO_BYTE = '0xCCDDEEFF'; // header stripped by 2 bytes
  const THREE_BYTE = '0xDDEEFF'; // header stripped by 3 bytes

  afterEach(() => vi.clearAllMocks());

  it('returns the parsed tx when the 2-byte strip succeeds', async () => {
    const resultValue = { ok: true };
    const txFromCallData = vi.fn(() => resultValue);

    const spy = vi.spyOn(Binary, 'fromHex');

    const out = await convertTxToPapi(makeTx(RAW), makePapi(txFromCallData));

    expect(spy).toHaveBeenCalledWith(TWO_BYTE);
    expect(txFromCallData).toHaveBeenCalledTimes(1);
    expect(txFromCallData).toHaveBeenCalledWith(TWO_BYTE);
    expect(out).toBe(resultValue);
  });

  it('falls back to a 3-byte strip when the 2-byte attempt throws', async () => {
    const resultValue = { ok: 'fallback' };
    const txFromCallData = vi
      .fn()
      .mockImplementationOnce(() => {
        throw new Error('bad header');
      })
      .mockReturnValueOnce(resultValue);

    const out = await convertTxToPapi(makeTx(RAW), makePapi(txFromCallData));

    expect(txFromCallData).toHaveBeenCalledTimes(2);
    expect(txFromCallData.mock.calls[0][0]).toBe(TWO_BYTE);
    expect(txFromCallData.mock.calls[1][0]).toBe(THREE_BYTE);
    expect(out).toBe(resultValue);
  });

  it('re-throws when parsing fails with both header lengths', async () => {
    const err = new Error('still broken');
    const txFromCallData = vi.fn(() => {
      throw err;
    });

    await expect(convertTxToPapi(makeTx(RAW), makePapi(txFromCallData))).rejects.toThrow(err);

    expect(txFromCallData).toHaveBeenCalledTimes(2);
  });
});
