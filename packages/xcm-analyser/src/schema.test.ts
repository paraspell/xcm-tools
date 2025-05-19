import { describe, expect, it } from 'vitest';

import {
  InteriorSchema,
  JunctionAccountId32,
  JunctionAccountKey20,
  JunctionGeneralKey,
  JunctionPalletInstance,
  JunctionParachain,
  MultiLocationSchema,
} from './schema';
import type {
  Junction,
  TJunctionAccountId32,
  TJunctionAccountIndex64,
  TJunctionAccountKey20,
  TJunctionGeneralIndex,
  TJunctionGeneralKey,
  TJunctionGlobalConsensus,
  TJunctionOnlyChild,
  TJunctionPalletInstance,
  TJunctionParachain,
  TJunctionPlurality,
} from './types';

const mockParachain: TJunctionParachain = { Parachain: 1000 };
const mockAccountId32: TJunctionAccountId32 = {
  AccountId32: {
    network: null,
    id: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
  },
};
const mockAccountIndex64: TJunctionAccountIndex64 = {
  AccountIndex64: { network: 'Polkadot', index: 12345 },
};
const mockAccountKey20: TJunctionAccountKey20 = {
  AccountKey20: { network: 'Kusama', key: '0xabcdef1234567890abcdef1234567890abcdef12' },
};
const mockPalletInstance: TJunctionPalletInstance = { PalletInstance: 50 };
const mockGeneralIndex: TJunctionGeneralIndex = { GeneralIndex: BigInt(100) };
const mockGeneralKey: TJunctionGeneralKey = {
  GeneralKey: { length: 32, data: '0xaabbccddeeff' },
};
const mockOnlyChild: TJunctionOnlyChild = { OnlyChild: '' };
const mockPlurality: TJunctionPlurality = {
  Plurality: { id: 'Executive', part: 'Fellowship' },
};
const mockGlobalConsensus: TJunctionGlobalConsensus = {
  GlobalConsensus: 'Ethereum',
};

const allMockJunctions: Junction[] = [
  mockParachain,
  mockAccountId32,
  mockAccountIndex64,
  mockAccountKey20,
  mockPalletInstance,
  mockGeneralIndex,
  mockGeneralKey,
  mockOnlyChild,
  mockPlurality,
  mockGlobalConsensus,
];

describe('InteriorSchema', () => {
  describe('Literal "Here"', () => {
    it('should pass for the literal string "Here"', () => {
      const data = 'Here';
      const result = InteriorSchema.safeParse(data);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe('Here');
      }
    });

    it('should pass for an object { Here: null }', () => {
      const data = { Here: null };
      const result = InteriorSchema.safeParse(data);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual({ Here: null });
      }
    });
  });

  describe('Junctions', () => {
    it('should pass for an empty object (all Junctions optional)', () => {
      const data = {};
      const result = InteriorSchema.safeParse(data);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual({});
      }
    });

    describe('X1 Junction', () => {
      it('should pass for X1 with a single JunctionSchema object', () => {
        const data = { X1: mockParachain };
        const result = InteriorSchema.safeParse(data);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data).toEqual({ X1: mockParachain });
        }
      });

      it('should pass for X1 with a tuple containing a single JunctionSchema object', () => {
        const data = { X1: [mockAccountId32] };
        const result = InteriorSchema.safeParse(data);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data).toEqual({ X1: [mockAccountId32] });
        }
      });

      it('should fail for X1 with a tuple containing more than one JunctionSchema object', () => {
        const data = { X1: [mockParachain, mockAccountId32] };
        const result = InteriorSchema.safeParse(data);
        expect(result.success).toBe(false);
      });

      it('should fail for X1 with an invalid JunctionSchema type', () => {
        const data = { X1: { InvalidJunction: 123 } };
        const result = InteriorSchema.safeParse(data);
        expect(result.success).toBe(false);
      });
    });

    describe('X2 Junctions', () => {
      it('should pass for X2 with a tuple of two JunctionSchema objects', () => {
        const data = { X2: [mockParachain, mockAccountKey20] };
        const result = InteriorSchema.safeParse(data);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data).toEqual({ X2: [mockParachain, mockAccountKey20] });
        }
      });

      it('should fail for X2 with a tuple of less than two JunctionSchema objects', () => {
        const data = { X2: [mockParachain] };
        const result = InteriorSchema.safeParse(data);
        expect(result.success).toBe(false);
      });

      it('should fail for X2 with a tuple of more than two JunctionSchema objects', () => {
        const data = { X2: [mockParachain, mockPalletInstance, mockGeneralIndex] };
        const result = InteriorSchema.safeParse(data);
        expect(result.success).toBe(false);
      });

      it('should fail for X2 with an invalid item in the tuple', () => {
        const data = { X2: [mockParachain, { InvalidJunction: true }] };
        const result = InteriorSchema.safeParse(data);
        expect(result.success).toBe(false);
      });
    });

    describe('X3 Junctions', () => {
      it('should pass for X3 with a tuple of three JunctionSchema objects', () => {
        const data = { X3: [mockGeneralKey, mockOnlyChild, mockPlurality] };
        const result = InteriorSchema.safeParse(data);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data).toEqual({ X3: [mockGeneralKey, mockOnlyChild, mockPlurality] });
        }
      });

      it('should fail for X3 with a tuple of less than three Junctions', () => {
        const data = { X3: [mockGeneralKey, mockOnlyChild] };
        const result = InteriorSchema.safeParse(data);
        expect(result.success).toBe(false);
      });
    });

    const xLevels = [
      { key: 'X1', count: 1 },
      { key: 'X2', count: 2 },
      { key: 'X3', count: 3 },
      { key: 'X4', count: 4 },
      { key: 'X5', count: 5 },
      { key: 'X6', count: 6 },
      { key: 'X7', count: 7 },
      { key: 'X8', count: 8 },
    ] as const;

    xLevels.forEach((level) => {
      describe(`${level.key} Junctions`, () => {
        const validJunctions = allMockJunctions.slice(0, level.count);

        if (level.count === 1 && level.key === 'X1') {
          it(`should pass for ${level.key} with a single JunctionSchema object`, () => {
            const data = { [level.key]: allMockJunctions[0] };
            const result = InteriorSchema.safeParse(data);
            expect(result.success, `Validation failed for ${level.key} with object`).toBe(true);
            if (result.success) {
              expect(result.data).toEqual({ [level.key]: allMockJunctions[0] });
            }
          });
        }

        it(`should pass for ${level.key} with a tuple of ${level.count} JunctionSchema object(s)`, () => {
          const junctionsForTest = level.key === 'X1' ? [validJunctions[0]] : validJunctions;
          const data = { [level.key]: junctionsForTest };
          const result = InteriorSchema.safeParse(data);
          expect(
            result.success,
            `Validation failed for ${level.key} with ${level.count} items`,
          ).toBe(true);
          if (result.success) {
            expect(result.data).toEqual({ [level.key]: junctionsForTest });
          }
        });

        if (level.key !== 'X1') {
          it(`should fail for ${level.key} with a tuple of ${level.count + 1} JunctionSchema objects`, () => {
            const tooManyJunctions = [...validJunctions, mockGlobalConsensus];
            const data = { [level.key]: tooManyJunctions };
            const result = InteriorSchema.safeParse(data);
            expect(
              result.success,
              `Validation should fail for ${level.key} with ${level.count + 1} items`,
            ).toBe(false);
          });
        }

        it(`should fail for ${level.key} with an invalid item in the tuple`, () => {
          const junctionsWithInvalid = [
            ...validJunctions.slice(0, level.count - 1),
            { NotAJunction: 'error' },
          ];
          const testData = level.key === 'X1' ? [{ NotAJunction: 'error' }] : junctionsWithInvalid;
          const data = { [level.key]: testData };
          const result = InteriorSchema.safeParse(data);
          expect(
            result.success,
            `Validation should fail for ${level.key} with an invalid item`,
          ).toBe(false);
        });
      });
    });

    it('should pass for multiple X levels defined correctly', () => {
      const data = {
        X1: mockParachain,
        X2: [mockAccountId32, mockAccountIndex64],
        X8: [
          mockAccountKey20,
          mockPalletInstance,
          mockGeneralIndex,
          mockGeneralKey,
          mockOnlyChild,
          mockPlurality,
          mockGlobalConsensus,
          mockParachain,
        ],
      };
      const result = InteriorSchema.safeParse(data);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(data);
      }
    });

    it('should fail if an unknown key is present alongside X keys', () => {
      const data = {
        X1: mockParachain,
        UnknownKey: 'someValue',
      };
      const result = InteriorSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should fail for an X key with a completely wrong data type (e.g., a number instead of object/array)', () => {
      const data = { X1: 12345 };
      const result = InteriorSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });

  describe('Invalid Interior Types', () => {
    it('should fail for a number', () => {
      const data = 123;
      const result = InteriorSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should fail for a boolean', () => {
      const data = true;
      const result = InteriorSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should fail for an array not matching any Junctions structure', () => {
      const data = [1, 2, 3];
      const result = InteriorSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should fail for an object that is not "Here: null" and not a valid Junctions object', () => {
      const data = { SomeOtherKey: 'value' };
      const result = InteriorSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should fail for { Here: "somethingElse" }', () => {
      const data = { Here: 'not null' };
      const result = InteriorSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });

  describe('StringOrNumber and StringOrNumberOrBigInt in Junctions', () => {
    it('JunctionParachain should correctly parse string number', () => {
      const data = { Parachain: '1,234' };
      const result = JunctionParachain.safeParse(data);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.Parachain).toBe('1234');
      }
    });

    it('JunctionParachain should correctly parse actual number', () => {
      const data = { Parachain: 1234 };
      const result = JunctionParachain.safeParse(data);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.Parachain).toBe(1234);
      }
    });

    it('JunctionParachain should correctly parse BigInt', () => {
      const data = { Parachain: BigInt(1234567890123) };
      const result = JunctionParachain.safeParse(data);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.Parachain).toBe(BigInt(1234567890123));
      }
    });

    it('JunctionGeneralIndex should correctly parse string number with commas (using .parse)', () => {
      const dataInterior = { X1: { GeneralIndex: '1,234,567' } };
      const parsedData = InteriorSchema.parse(dataInterior);

      expect(parsedData).toMatchObject({
        X1: {
          GeneralIndex: '1234567',
        },
      });
    });

    it('JunctionGeneralIndex should correctly parse plain string number', () => {
      const dataInterior = { X1: { GeneralIndex: '1234567' } };
      const parsedData = InteriorSchema.parse(dataInterior);
      expect(parsedData).toMatchObject({
        X1: {
          GeneralIndex: '1234567',
        },
      });
    });

    it('JunctionGeneralIndex should correctly parse actual number', () => {
      const dataInterior = { X1: { GeneralIndex: 1234567 } };
      const parsedData = InteriorSchema.parse(dataInterior);
      expect(parsedData).toMatchObject({
        X1: {
          GeneralIndex: 1234567,
        },
      });
    });

    it('JunctionGeneralIndex should correctly parse BigInt', () => {
      const dataInterior = { X1: { GeneralIndex: BigInt(9876543210987) } };
      const parsedData = InteriorSchema.parse(dataInterior);
      expect(parsedData).toMatchObject({
        X1: {
          GeneralIndex: BigInt(9876543210987),
        },
      });
    });

    it('JunctionPalletInstance should fail for invalid string number format', () => {
      const data = { PalletInstance: '1,2,3' };
      const result = JunctionPalletInstance.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('JunctionPalletInstance should fail for non-numeric string', () => {
      const data = { PalletInstance: 'abc' };
      const result = JunctionPalletInstance.safeParse(data);
      expect(result.success).toBe(false);
    });
  });

  describe('HexString validation in Junctions', () => {
    it('JunctionAccountId32 should pass for valid hex id', () => {
      const data = {
        AccountId32: {
          network: null,
          id: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
        },
      };
      const result = JunctionAccountId32.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('JunctionAccountId32 should fail for invalid hex id (no 0x prefix)', () => {
      const data = { AccountId32: { network: null, id: '1234567890abcdef' } };
      const result = JunctionAccountId32.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('JunctionAccountId32 should fail for invalid hex id (invalid characters)', () => {
      const data = { AccountId32: { network: null, id: '0x1234567890ghijk' } };
      const result = JunctionAccountId32.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('JunctionAccountKey20 should pass for valid hex key', () => {
      const data = {
        AccountKey20: { network: 'Kusama', key: '0xabcdef1234567890abcdef1234567890abcdef12' },
      };
      const result = JunctionAccountKey20.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('JunctionAccountKey20 should fail for invalid hex key (too short, if length matters implicitly by type name, though schema only checks format)', () => {
      const data = { AccountKey20: { network: 'Kusama', key: '0xabc' } };
      const result = JunctionAccountKey20.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('JunctionGeneralKey should pass for valid hex data', () => {
      const data = { GeneralKey: { length: 6, data: '0xaabbccddeeff' } };
      const result = JunctionGeneralKey.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('JunctionGeneralKey should fail for invalid hex data', () => {
      // Missing 0x
      const data = { GeneralKey: { length: 6, data: 'aabbccddeeff' } };
      const result = JunctionGeneralKey.safeParse(data);
      expect(result.success).toBe(false);
    });
  });
});

describe('MultiLocationSchema', () => {
  it('should pass with valid parents and Interior "Here"', () => {
    const data = { parents: 0, interior: 'Here' };
    const result = MultiLocationSchema.safeParse(data);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual({ parents: 0, interior: 'Here' });
    }
  });

  it('should pass with valid parents (string with comma) and Interior { Here: null }', () => {
    const data = { parents: '1,000', interior: { Here: null } };
    const result = MultiLocationSchema.safeParse(data);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual({ parents: '1000', interior: { Here: null } });
    }
  });

  it('should pass with valid parents and Interior with X1 Junction', () => {
    const data = { parents: 1, interior: { X1: mockParachain } };
    const result = MultiLocationSchema.safeParse(data);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual({ parents: 1, interior: { X1: mockParachain } });
    }
  });

  it('should fail if interior is invalid', () => {
    const data = { parents: 0, interior: { InvalidInterior: true } };
    const result = MultiLocationSchema.safeParse(data);
    expect(result.success).toBe(false);
  });

  it('should fail if parents is invalid', () => {
    const data = { parents: 'abc', interior: 'Here' };
    const result = MultiLocationSchema.safeParse(data);
    expect(result.success).toBe(false);
  });
});
