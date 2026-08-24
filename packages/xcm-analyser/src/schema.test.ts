import { describe, expect, expectTypeOf, it } from 'vitest';

import {
  GLOBAL_CONSENSUS_NETWORKS,
  GlobalConsensusNetworkSchema,
  InteriorSchema,
  JunctionAccountId32,
  JunctionAccountIndex64,
  JunctionAccountKey20,
  JunctionGeneralIndex,
  JunctionGeneralKey,
  JunctionPalletInstance,
  JunctionParachain,
  JunctionSchema,
  LocationSchema,
} from './schema';
import type {
  Junction,
  TGlobalConsensusNetwork,
  TGlobalConsensusStringNetwork,
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
  AccountIndex64: { network: 'Polkadot', index: 12345n },
};
const mockAccountKey20: TJunctionAccountKey20 = {
  AccountKey20: { network: 'Kusama', key: '0xabcdef1234567890abcdef1234567890abcdef12' },
};
const mockPalletInstance: TJunctionPalletInstance = { PalletInstance: 50 };
const mockGeneralIndex: TJunctionGeneralIndex = { GeneralIndex: 100n };
const mockGeneralKey: TJunctionGeneralKey = {
  GeneralKey: { length: 32, data: '0xaabbccddeeff' },
};
const mockOnlyChild: TJunctionOnlyChild = { OnlyChild: '' };
const mockPlurality: TJunctionPlurality = {
  Plurality: { id: 'Executive', part: 'Fellowship' },
};
const mockGlobalConsensus: TJunctionGlobalConsensus = {
  GlobalConsensus: 'Polkadot',
};

const mockHash = `0x${'ab'.repeat(32)}`;

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
    it('should fail for an empty object (interior must be "Here" or exactly one junction)', () => {
      const data = {};
      const result = InteriorSchema.safeParse(data);
      expect(result.success).toBe(false);
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

    it('should fail for multiple X levels (interior must hold exactly one junction)', () => {
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
      expect(result.success).toBe(false);
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

    it('should fail when one object contains multiple junction variants', () => {
      const result = JunctionSchema.safeParse({ Parachain: 1000, GeneralIndex: 1 });
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

  describe('Unsigned integer junction fields', () => {
    it('accepts u8 and u32 fields as numbers', () => {
      const parachain = JunctionParachain.parse({ Parachain: 4_294_967_295 });
      const palletInstance = JunctionPalletInstance.parse({ PalletInstance: 255 });
      const generalKey = JunctionGeneralKey.parse({
        GeneralKey: { length: 32, data: '0x00' },
      });

      expect(parachain.Parachain).toBe(4_294_967_295);
      expect(palletInstance.PalletInstance).toBe(255);
      expect(generalKey.GeneralKey.length).toBe(32);
      expectTypeOf(parachain.Parachain).toEqualTypeOf<number>();
      expectTypeOf(palletInstance.PalletInstance).toEqualTypeOf<number>();
      expectTypeOf(generalKey.GeneralKey.length).toEqualTypeOf<number>();
    });

    it('normalizes u64 and u128 fields to bigints', () => {
      const accountIndex = JunctionAccountIndex64.parse({
        AccountIndex64: { network: null, index: 12345n },
      });
      const generalIndex = JunctionGeneralIndex.parse({ GeneralIndex: '1,234,567' });

      expect(accountIndex.AccountIndex64.index).toBe(12345n);
      expect(generalIndex.GeneralIndex).toBe(1234567n);
      expectTypeOf(accountIndex.AccountIndex64.index).toEqualTypeOf<bigint>();
      expectTypeOf(generalIndex.GeneralIndex).toEqualTypeOf<bigint>();
    });

    const boundedJunctionCases = [
      {
        name: 'Parachain u32',
        parse: (value: unknown) => JunctionParachain.safeParse({ Parachain: value }),
        valid: [0, 4_294_967_295],
        invalid: [-1, '-1', 1.5, '1.5', 4_294_967_296, 4_294_967_295n, '4294967295'],
      },
      {
        name: 'AccountIndex64.index u64',
        parse: (value: unknown) =>
          JunctionAccountIndex64.safeParse({ AccountIndex64: { network: null, index: value } }),
        valid: [0, 18_446_744_073_709_551_615n, '18,446,744,073,709,551,615'],
        invalid: [-1, '-1', 1.5, '1.5', Number.MAX_SAFE_INTEGER + 1, '18446744073709551616'],
      },
      {
        name: 'PalletInstance u8',
        parse: (value: unknown) => JunctionPalletInstance.safeParse({ PalletInstance: value }),
        valid: [0, 255],
        invalid: [-1, '-1', 1.5, '1.5', 256, 255n, '255'],
      },
      {
        name: 'GeneralIndex u128',
        parse: (value: unknown) => JunctionGeneralIndex.safeParse({ GeneralIndex: value }),
        valid: [
          0,
          340_282_366_920_938_463_463_374_607_431_768_211_455n,
          '340,282,366,920,938,463,463,374,607,431,768,211,455',
        ],
        invalid: [
          -1n,
          '-1',
          1.5,
          '1.5',
          Number.MAX_SAFE_INTEGER + 1,
          '340282366920938463463374607431768211456',
        ],
      },
      {
        name: 'GeneralKey.length u8',
        parse: (value: unknown) =>
          JunctionGeneralKey.safeParse({ GeneralKey: { length: value, data: '0x00' } }),
        valid: [0, 255],
        invalid: [-1, '-1', 1.5, '1.5', 256, 255n, '255'],
      },
    ];

    for (const { name, parse, valid, invalid } of boundedJunctionCases) {
      it.each(valid)(`${name} accepts valid boundary value: %s`, (value) => {
        expect(parse(value).success).toBe(true);
      });

      it.each(invalid)(`${name} rejects invalid value: %s`, (value) => {
        expect(parse(value).success).toBe(false);
      });
    }

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

    it('JunctionAccountId32 should fail for an empty prefixed hex id', () => {
      const data = { AccountId32: { network: null, id: '0x' } };
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

  describe('GlobalConsensusNetworkSchema', () => {
    it('should infer the exact generated string variants', () => {
      expectTypeOf<TGlobalConsensusStringNetwork>().toEqualTypeOf<TGlobalConsensusNetwork>();
    });

    it.each(
      GLOBAL_CONSENSUS_NETWORKS.map(
        (network) => network.charAt(0).toUpperCase() + network.slice(1),
      ),
    )('should pass for generated string variant %s', (network) => {
      expect(GlobalConsensusNetworkSchema.safeParse(network).success).toBe(true);
    });

    it.each(GLOBAL_CONSENSUS_NETWORKS.map((network) => ({ [network]: null })))(
      'should pass for codec-style unit object variant %#',
      (network) => {
        expect(GlobalConsensusNetworkSchema.safeParse(network).success).toBe(true);
      },
    );

    it.each([
      { ByGenesis: mockHash },
      { ByFork: { blockNumber: 123, blockHash: mockHash } },
      { Ethereum: { chainId: 1 } },
    ])('should pass for payload variant %#', (network) => {
      expect(GlobalConsensusNetworkSchema.safeParse(network).success).toBe(true);
    });

    it('should normalize u64 payload variants to bigints', () => {
      expect(
        GlobalConsensusNetworkSchema.parse({
          ByFork: { blockNumber: '1,234', blockHash: mockHash },
        }),
      ).toEqual({ ByFork: { blockNumber: 1234n, blockHash: mockHash } });

      expect(GlobalConsensusNetworkSchema.parse({ Ethereum: { chainId: '1,234' } })).toEqual({
        Ethereum: { chainId: 1234n },
      });

      expect(GlobalConsensusNetworkSchema.parse({ Ethereum: { chainId: 1234 } })).toEqual({
        Ethereum: { chainId: 1234n },
      });
    });

    it('should enforce the u64 range for payload variants', () => {
      const maxUint64 = 18_446_744_073_709_551_615n;
      const overUint64 = '18446744073709551616';

      expect(
        GlobalConsensusNetworkSchema.parse({
          ByFork: { blockNumber: maxUint64.toString(), blockHash: mockHash },
        }),
      ).toEqual({ ByFork: { blockNumber: maxUint64, blockHash: mockHash } });
      expect(
        GlobalConsensusNetworkSchema.parse({
          Ethereum: { chainId: 18_446_744_073_709_551_615n },
        }),
      ).toEqual({ Ethereum: { chainId: maxUint64 } });

      expect(
        GlobalConsensusNetworkSchema.safeParse({
          ByFork: { blockNumber: overUint64, blockHash: mockHash },
        }).success,
      ).toBe(false);
      expect(
        GlobalConsensusNetworkSchema.safeParse({
          Ethereum: { chainId: Number.MAX_SAFE_INTEGER + 1 },
        }).success,
      ).toBe(false);
    });

    it.each([
      'UnknownNetwork',
      { type: 'Polkadot' },
      { type: 'Ethereum', value: { chainId: 1 } },
      { Ethereum: { chainId: 'not-a-number' } },
      {},
      { polkadot: undefined },
      { polkadot: 'invalid' },
      { polkadot: null, kusama: null },
      { unknownnetwork: null },
      { ByGenesis: '0x1234' },
      { UnsupportedNetwork: null },
    ])('should fail for unsupported network data %#', (network) => {
      expect(GlobalConsensusNetworkSchema.safeParse(network).success).toBe(false);
    });
  });
});

describe('LocationSchema', () => {
  it('should pass with valid parents and Interior "Here"', () => {
    const data = { parents: 0, interior: 'Here' };
    const result = LocationSchema.safeParse(data);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual({ parents: 0, interior: 'Here' });
    }
  });

  it('should pass with maximum parents and Interior { Here: null }', () => {
    const data = { parents: 255, interior: { Here: null } };
    const result = LocationSchema.safeParse(data);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual({ parents: 255, interior: { Here: null } });
    }
  });

  it('should pass with valid parents and Interior with X1 Junction', () => {
    const data = { parents: 1, interior: { X1: mockParachain } };
    const result = LocationSchema.safeParse(data);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual({ parents: 1, interior: { X1: mockParachain } });
    }
  });

  it('should fail if interior is invalid', () => {
    const data = { parents: 0, interior: { InvalidInterior: true } };
    const result = LocationSchema.safeParse(data);
    expect(result.success).toBe(false);
  });

  it('should fail if parents is invalid', () => {
    const data = { parents: 'abc', interior: 'Here' };
    const result = LocationSchema.safeParse(data);
    expect(result.success).toBe(false);
  });

  it.each([-1, 1.5, 256, '0', '255', 'abc'])(
    'should fail if parents is not a valid u8: %s',
    (parents) => {
      const result = LocationSchema.safeParse({ parents, interior: 'Here' });
      expect(result.success).toBe(false);
    },
  );
});
