import { describe, it, expect } from 'vitest';
import { BadRequestException } from '@nestjs/common';
import { isNumeric, validateNode } from './utils.js';

describe('isNumeric', () => {
  it('should return true for numeric values', () => {
    expect(isNumeric(123)).toBe(true);
    expect(isNumeric('123')).toBe(true);
    expect(isNumeric('0')).toBe(true);
  });

  it('should return false for non-numeric values', () => {
    expect(isNumeric('abc')).toBe(false);
    expect(isNumeric('123abc')).toBe(false);
    expect(isNumeric(undefined)).toBe(false);
    expect(isNumeric(NaN)).toBe(false);
    expect(isNumeric({})).toBe(false);
  });
});

describe('validateNode', () => {
  it('should not throw for valid node', () => {
    expect(() => validateNode('Acala')).not.toThrow();
  });

  it('should throw BadRequestException for invalid node', () => {
    expect(() => validateNode('InvalidNode')).toThrow(BadRequestException);
  });
});
