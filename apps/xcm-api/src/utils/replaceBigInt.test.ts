import { describe, it, expect } from 'vitest';
import { replaceBigInt } from './replaceBigInt.js';

describe('replaceBigInt', () => {
  it('should convert bigint to string', () => {
    const result = replaceBigInt('', BigInt(123456789));
    expect(result).toBe('123456789');
  });

  it('should return non-bigint values as-is', () => {
    const result = replaceBigInt('', 123);
    expect(result).toBe(123);

    const stringValue = replaceBigInt('', 'test');
    expect(stringValue).toBe('test');

    const boolValue = replaceBigInt('', true);
    expect(boolValue).toBe(true);

    const nullValue = replaceBigInt('', null);
    expect(nullValue).toBe(null);

    const undefinedValue = replaceBigInt('', undefined);
    expect(undefinedValue).toBe(undefined);
  });
});
