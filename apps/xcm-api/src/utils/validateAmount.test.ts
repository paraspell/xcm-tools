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
});
