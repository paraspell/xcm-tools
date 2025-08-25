import { BadRequestException } from '@nestjs/common';
import type { TPallet } from '@paraspell/sdk';
import { PALLETS } from '@paraspell/sdk';
import { describe, expect, it, vi } from 'vitest';

import { validatePallet } from './validatePallet.js';

vi.mock('@paraspell/sdk', async (importOriginal) => {
  const original = await importOriginal<typeof import('@paraspell/sdk')>();
  return {
    ...original,
    PALLETS: ['System', 'Balances', 'Assets'] as TPallet[],
  };
});

describe('validatePallet', () => {
  it('should return the pallet if it is supported', () => {
    const validPallet = 'System';
    expect(PALLETS.includes(validPallet as TPallet)).toBe(true);
    expect(validatePallet(validPallet)).toBe(validPallet);
  });

  it('should return another supported pallet', () => {
    const validPallet = 'Assets';
    expect(PALLETS.includes(validPallet as TPallet)).toBe(true);
    expect(validatePallet(validPallet)).toBe(validPallet);
  });

  it('should throw BadRequestException for an unsupported pallet', () => {
    const invalidPallet = 'UnsupportedPallet';
    expect(PALLETS.includes(invalidPallet as TPallet)).toBe(false);

    expect(() => validatePallet(invalidPallet)).toThrow(BadRequestException);
  });

  it('should throw BadRequestException with a specific message for an unsupported pallet', () => {
    const invalidPallet = 'DoesNotExist';
    try {
      validatePallet(invalidPallet);
    } catch (error) {
      expect(error).toBeInstanceOf(BadRequestException);
      if (error instanceof BadRequestException) {
        expect(error.message).toBe(
          `Invalid pallet: ${invalidPallet}. Check docs for valid pallets.`,
        );
      }
    }
  });

  it('should be case-sensitive and throw for incorrect casing if not in SUPPORTED_PALLETS', () => {
    const palletWithWrongCase = 'system';
    expect(PALLETS.includes(palletWithWrongCase as TPallet)).toBe(false);
    expect(PALLETS.includes('System' as TPallet)).toBe(true);

    expect(() => validatePallet(palletWithWrongCase)).toThrow(
      BadRequestException,
    );
    expect(() => validatePallet(palletWithWrongCase)).toThrow(
      `Invalid pallet: ${palletWithWrongCase}. Check docs for valid pallets.`,
    );
  });

  it('should throw BadRequestException for an empty string pallet', () => {
    const emptyPallet = '';
    expect(() => validatePallet(emptyPallet)).toThrow(BadRequestException);
    expect(() => validatePallet(emptyPallet)).toThrow(
      `Invalid pallet: ${emptyPallet}. Check docs for valid pallets.`,
    );
  });
});
