import { describe, expect, it, vi } from 'vitest';

import { getExchangePairs } from './getExchangePairs';

type RA = { symbol: string; assetId: string; multiLocation?: unknown };

const assetABC: RA = { symbol: 'ABC', assetId: '1', multiLocation: { foo: 'bar' } };
const assetXYZ: RA = { symbol: 'XYZ', assetId: '2' };
const altLocation = { foo: 'BAR' };

vi.mock('@paraspell/sdk', () => ({
  deepEqual: (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b),
  reverseTransformMultiLocation: vi.fn((loc: unknown) =>
    JSON.stringify(loc) === JSON.stringify(altLocation) ? assetABC.multiLocation : loc,
  ),
}));

vi.mock('../consts', () => ({
  EXCHANGE_NODES: ['HydrationDex', 'AssetHubPolkadotDex'],
}));

const mockConfigs = {
  HydrationDex: {
    isOmni: true,
    assets: [assetABC, assetXYZ],
    pairs: [
      ['ABC', '2'],
      [assetABC.multiLocation!, 'XYZ'],
    ],
  },
  AssetHubPolkadotDex: {
    isOmni: false,
    assets: [assetABC, assetXYZ],
    pairs: [[altLocation, '2']],
  },
};

vi.mock('./getExchangeConfig', () => ({
  getExchangeConfig: (ex: string) => mockConfigs[ex as keyof typeof mockConfigs],
}));

describe('getExchangePairs', () => {
  it('returns Cartesian pairs for an omnipool exchange', () => {
    const pairs = getExchangePairs('HydrationDex');

    expect(pairs).toHaveLength(1);
    expect(pairs[0][0]).toBe(assetABC);
    expect(pairs[0][1]).toBe(assetXYZ);
  });

  it('resolves multiLocation keys using reverseTransform on Asset-Hub exchanges', () => {
    const pairs = getExchangePairs('AssetHubPolkadotDex');

    expect(pairs).toHaveLength(1);
    expect(pairs[0][0]).toBe(assetABC);
    expect(pairs[0][1]).toBe(assetXYZ);
  });

  it('aggregates pairs when an array of exchanges is supplied', () => {
    const pairs = getExchangePairs(['HydrationDex', 'AssetHubPolkadotDex']);
    expect(pairs).toHaveLength(2);
  });

  it('uses EXCHANGE_NODES when input is undefined', () => {
    const pairs = getExchangePairs(undefined);
    expect(pairs).toHaveLength(2);
  });
});
