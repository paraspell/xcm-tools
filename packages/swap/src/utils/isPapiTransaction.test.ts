import { describe, expect, it } from 'vitest';

import { isPapiTransaction } from './isPapiTransaction';

describe('isPapiTransaction', () => {
  it('returns true for a PAPI transaction', () => {
    const tx = {
      getEncodedData: () => {},
      createSubmitAndWatch: () => {},
    };

    expect(isPapiTransaction(tx)).toBe(true);
  });

  it('returns false for null', () => {
    expect(isPapiTransaction(null)).toBe(false);
  });

  it('returns false when createSubmitAndWatch is missing', () => {
    const tx = {
      getEncodedData: () => {},
    };

    expect(isPapiTransaction(tx)).toBe(false);
  });

  it('returns false when createSubmitAndWatch is not a function', () => {
    const tx = {
      getEncodedData: () => {},
      createSubmitAndWatch: 'not-a-function',
    };

    expect(isPapiTransaction(tx)).toBe(false);
  });
});
