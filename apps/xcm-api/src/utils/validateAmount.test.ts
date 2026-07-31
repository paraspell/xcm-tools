import { describe, expect, it } from 'vitest';

import { validateAmount } from './validateAmount.js';

describe('validateAmount', () => {
  it('should return true for valid positive numbers as strings', () => {
    expect(validateAmount('100')).toBe(true);
    expect(validateAmount('0.5')).toBe(true);
    expect(validateAmount('1234.567')).toBe(true);
    expect(validateAmount('.5')).toBe(true);
    expect(validateAmount('+1')).toBe(true);
    expect(validateAmount('1e3')).toBe(true);
    expect(validateAmount('1e-3')).toBe(true);
    expect(validateAmount(' 0.5 ')).toBe(true);
  });

  it('should return false for negative numbers', () => {
    expect(validateAmount('-100')).toBe(false);
    expect(validateAmount('-0.5')).toBe(false);
  });

  it('should reject malformed numeric strings instead of accepting a numeric prefix', () => {
    expect(validateAmount('1abc')).toBe(false);
    expect(validateAmount('1.2.3')).toBe(false);
    expect(validateAmount('1e')).toBe(false);
  });

  it('should reject non-finite and overflowed values', () => {
    expect(validateAmount('Infinity')).toBe(false);
    expect(validateAmount('-Infinity')).toBe(false);
    expect(validateAmount('NaN')).toBe(false);
    expect(validateAmount('1e309')).toBe(false);
  });

  it('should reject empty and non-positive values', () => {
    expect(validateAmount('')).toBe(false);
    expect(validateAmount('   ')).toBe(false);
    expect(validateAmount('0')).toBe(false);
    expect(validateAmount('-0')).toBe(false);
  });
});
