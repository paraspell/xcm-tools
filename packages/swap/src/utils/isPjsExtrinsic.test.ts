import type { TPapiTransaction } from '@paraspell/sdk';
import type { Extrinsic } from '@paraspell/sdk-pjs';
import { describe, expect, it } from 'vitest';

import { isPjsExtrinsic } from './isPjsExtrinsic';

describe('isPjsExtrinsic', () => {
  it('should return false for a papi extrinsic object', () => {
    const mockExtrinsic = {
      send: () => {},
      signAndSend: () => {},
      signAsync: () => {},
      getEncodedData: () => {},
    } as unknown as TPapiTransaction;

    expect(isPjsExtrinsic(mockExtrinsic)).toBe(false);
  });

  it('should return true for a valid PJS extrinsic object', () => {
    const mockExtrinsic = {
      send: () => {},
      signAndSend: () => {},
      signAsync: () => {},
      paymentInfo: () => {},
    } as unknown as Extrinsic;

    expect(isPjsExtrinsic(mockExtrinsic)).toBe(true);
  });

  it('should return false if required methods are missing', () => {
    const missingSend = {
      signAndSend: () => {},
      signAsync: () => {},
      paymentInfo: () => {},
    } as unknown as Extrinsic;

    expect(isPjsExtrinsic(missingSend)).toBe(false);

    const missingSignAndSend = {
      send: () => {},
      signAsync: () => {},
      paymentInfo: () => {},
    } as unknown as Extrinsic;

    expect(isPjsExtrinsic(missingSignAndSend)).toBe(false);

    const missingSignAsync = {
      send: () => {},
      signAndSend: () => {},
      paymentInfo: () => {},
    } as unknown as Extrinsic;

    expect(isPjsExtrinsic(missingSignAsync)).toBe(false);

    const missingPaymentInfo = {
      send: () => {},
      signAndSend: () => {},
      signAsync: () => {},
    } as unknown as Extrinsic;

    expect(isPjsExtrinsic(missingPaymentInfo)).toBe(false);
  });

  it('should return false if any required method is not a function', () => {
    const invalidSend = {
      send: 'not a function',
      signAndSend: () => {},
      signAsync: () => {},
      paymentInfo: () => {},
    } as unknown as Extrinsic;

    expect(isPjsExtrinsic(invalidSend)).toBe(false);

    const invalidSignAndSend = {
      send: () => {},
      signAndSend: 'not a function',
      signAsync: () => {},
      paymentInfo: () => {},
    } as unknown as Extrinsic;

    expect(isPjsExtrinsic(invalidSignAndSend)).toBe(false);

    const invalidSignAsync = {
      send: () => {},
      signAndSend: () => {},
      signAsync: 42,
      paymentInfo: () => {},
    } as unknown as Extrinsic;

    expect(isPjsExtrinsic(invalidSignAsync)).toBe(false);

    const invalidPaymentInfo = {
      send: () => {},
      signAndSend: () => {},
      signAsync: () => {},
      paymentInfo: null,
    } as unknown as Extrinsic;

    expect(isPjsExtrinsic(invalidPaymentInfo)).toBe(false);
  });
});
