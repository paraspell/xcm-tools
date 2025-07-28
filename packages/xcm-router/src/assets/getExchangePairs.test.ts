import type { TAssetInfo, TLocation } from '@paraspell/sdk';
import { describe, expect, it, vi } from 'vitest';

import { getExchangePairs } from './getExchangePairs';

const assetABC: TAssetInfo = {
  symbol: 'ABC',
  assetId: '1',
  location: { foo: 'bar' } as unknown as TLocation,
};
const assetXYZ: TAssetInfo = {
  symbol: 'XYZ',
  assetId: '2',
  location: { foo: 'baz' } as unknown as TLocation,
};
const altLocation = { foo: 'BAR' };

vi.mock('@paraspell/sdk', () => ({
  deepEqual: (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b),
  reverseTransformLocation: vi.fn((loc: unknown) =>
    JSON.stringify(loc) === JSON.stringify(altLocation) ? assetABC.location : loc,
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
      [assetABC.location, 'XYZ'],
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

  it('resolves location keys using reverseTransform on Asset-Hub exchanges', () => {
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
