import type { TMultiLocation, TJunction } from '@paraspell/sdk-pjs';
import { describe, it, expect } from 'vitest';
import { compareXcmInteriors, extractJunctions } from './assetsUtils';

describe('extractJunctions', () => {
  it('should return empty array when interior is "Here"', () => {
    const multiLocation: TMultiLocation = { parents: 1, interior: 'Here' };
    expect(extractJunctions(multiLocation)).toEqual([]);
  });

  it('should extract junctions from first X key in interior', () => {
    const junctions: [TJunction, TJunction] = [{ Parachain: 'J1' }, { PalletInstance: 'J2' }];
    const multiLocation: TMultiLocation = { parents: 1, interior: { X2: junctions } };
    expect(extractJunctions(multiLocation)).toBe(junctions);
  });

  it('should return empty array when no X keys are present', () => {
    const multiLocation = { interior: { Y: [{ key: 'J3' }] } } as unknown as TMultiLocation;
    expect(extractJunctions(multiLocation)).toEqual([]);
  });

  it('should return first X key junctions when multiple X keys exist', () => {
    const junctions1: [TJunction] = [{ Parachain: 'A' }];
    const junctions2: [TJunction, TJunction, TJunction] = [
      { PalletInstance: 'B' },
      { Parachain: 'C' },
      { Parachain: 'D' },
    ];
    const multiLocation: TMultiLocation = {
      parents: 1,
      interior: {
        X1: junctions1,
        X3: junctions2,
      },
    };
    expect(extractJunctions(multiLocation)).toBe(junctions1);
  });

  it('should handle empty junction array in X key', () => {
    const multiLocation = { interior: { X4: [] } } as unknown as TMultiLocation;
    expect(extractJunctions(multiLocation)).toEqual([]);
  });

  it('should ignore non-X keys when X key exists', () => {
    const junctions: [TJunction, TJunction, TJunction, TJunction, TJunction] = [
      { Parachain: 'J4' },
      { Parachain: 'J5' },
      { Parachain: 'J6' },
      { Parachain: 'J7' },
      { Parachain: 'J8' },
    ];
    const multiLocation = {
      parents: 1,
      interior: {
        Y: [{ key: 'J5' }],
        X5: junctions,
      },
    } as unknown as TMultiLocation;
    expect(extractJunctions(multiLocation)).toBe(junctions);
  });
});

describe('compareXcmInteriors', () => {
  it('should return false when either input is undefined', () => {
    expect(compareXcmInteriors(undefined, [])).toBe(false);
    expect(compareXcmInteriors([], undefined)).toBe(false);
    expect(compareXcmInteriors(undefined, undefined)).toBe(false);
  });

  it('should filter out junctions containing Network key', () => {
    const value = [
      { Network: 'Kusama' }, // Filtered out
      { Parachain: 2000 },
    ] as TJunction[];

    const other = [{ Parachain: 2000 }] as TJunction[];

    expect(compareXcmInteriors(value, other)).toBe(true);
  });

  it('should return false when filtered arrays have different lengths', () => {
    const value = [{ Parachain: 1000 }, { Parachain: 2000 }] as TJunction[];

    const other = [{ Parachain: 1000 }] as TJunction[];

    expect(compareXcmInteriors(value, other)).toBe(false);
  });

  it('should return false when elements are not deeply equal', () => {
    const value = [
      { Parachain: 1000 },
      { AccountId32: { network: 'Kusama', id: '0x1234' } },
    ] as TJunction[];

    const other = [
      { Parachain: 1000 },
      { AccountId32: { network: 'Polkadot', id: '0x1234' } },
    ] as TJunction[];

    expect(compareXcmInteriors(value, other)).toBe(false);
  });

  it('should return true when filtered arrays are deeply equal', () => {
    const value = [
      { Parachain: 1000 },
      { AccountId32: { network: null, id: '0xabcd' } },
    ] as TJunction[];

    const other = [
      { Parachain: 1000 },
      { AccountId32: { network: null, id: '0xabcd' } },
    ] as TJunction[];

    expect(compareXcmInteriors(value, other)).toBe(true);
  });

  it('should handle empty arrays after filtering', () => {
    const value = [
      { Network: 'Polkadot' }, // Filtered out
      { Network: 'Kusama' }, // Filtered out
    ] as unknown as TJunction[];

    const other = [] as TJunction[];

    expect(compareXcmInteriors(value, other)).toBe(true);
  });

  it('should consider order of junctions important', () => {
    const value = [{ Parachain: 1000 }, { AccountId32: { id: '0x1234' } }] as TJunction[];

    const other = [{ AccountId32: { id: '0x1234' } }, { Parachain: 1000 }] as TJunction[];

    expect(compareXcmInteriors(value, other)).toBe(false);
  });

  it('should handle complex junction comparisons', () => {
    const value = [
      {
        X3: [
          { Parachain: 2000 },
          { AccountId32: { id: '0x1234', network: 'Kusama' } },
          { GeneralIndex: 5 },
        ],
      },
    ] as unknown as TJunction[];

    const other = [
      {
        X3: [
          { Parachain: 2000 },
          { AccountId32: { id: '0x1234', network: 'Kusama' } },
          { GeneralIndex: 5 },
        ],
      },
    ] as unknown as TJunction[];

    expect(compareXcmInteriors(value, other)).toBe(true);
  });
});
