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

  it('should return false for malformed or non-finite values', () => {
    expect(validateAmount('1abc')).toBe(false);
    expect(validateAmount('1.2.3')).toBe(false);
    expect(validateAmount('Infinity')).toBe(false);
    expect(validateAmount('1e309')).toBe(false);
  });
});
