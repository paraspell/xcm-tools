import { describe, expect, it } from 'vitest';

import { validateAmount } from './validateAmount.js';

describe('validateAmount', () => {
  it('should return true for valid positive numbers as strings', () => {
    expect(validateAmount('100')).toBe(true);
    expect(validateAmount('0.5')).toBe(true);
    expect(validateAmount('1234.567')).toBe(true);
  });

  it('should return false for negative numbers', () => {
    expect(validateAmount('-100')).toBe(false);
    expect(validateAmount('-0.5')).toBe(false);
  });

  it.each(['1abc', '1.2.3', 'Infinity', '1e309'])(
    'should return false for malformed or non-finite amount %s',
    (amount) => {
      expect(validateAmount(amount)).toBe(false);
    },
  );
});
