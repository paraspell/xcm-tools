import type { TAssetInfo } from '@paraspell/sdk';
import { describe, expect, it, vi } from 'vitest';

import { getExchangePairs } from './getExchangePairs';

const assetA: TAssetInfo = {
  symbol: 'ABC',
  decimals: 12,
  assetId: '1',
  location: { parents: 1, interior: 'Here' },
};

const assetB: TAssetInfo = {
  symbol: 'XYZ',
  decimals: 12,
  assetId: '2',
  location: { parents: 1, interior: { X1: [{ Parachain: 1000 }] } },
};

const altLocation = { parents: 1, interior: { X1: [{ Parachain: 2000 }] } };

vi.mock('@paraspell/sdk', async (importActual) => ({
  ...(await importActual()),
  EXCHANGE_CHAINS: ['HydrationDex', 'AssetHubPolkadotDex'],
  deepEqual: (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b),
  reverseTransformLocation: vi.fn((loc: unknown) =>
    JSON.stringify(loc) === JSON.stringify(altLocation) ? assetA.location : loc,
  ),
}));

const mockConfigs = {
  HydrationDex: {
    isOmni: true,
    assets: [assetA, assetB],
    pairs: [
      ['ABC', '2'],
      [assetA.location, 'XYZ'],
    ],
  },
  AssetHubPolkadotDex: {
    isOmni: false,
    assets: [assetA, assetB],
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
    expect(pairs[0][0]).toBe(assetA);
    expect(pairs[0][1]).toBe(assetB);
  });

  it('resolves location keys using reverseTransform on Asset-Hub exchanges', () => {
    const pairs = getExchangePairs('AssetHubPolkadotDex');

    expect(pairs).toHaveLength(1);
    expect(pairs[0][0]).toBe(assetA);
    expect(pairs[0][1]).toBe(assetB);
  });

  it('aggregates pairs when an array of exchanges is supplied', () => {
    const pairs = getExchangePairs(['HydrationDex', 'AssetHubPolkadotDex']);
    expect(pairs).toHaveLength(2);
  });

  it('uses EXCHANGE_CHAINS when input is undefined', () => {
    const pairs = getExchangePairs(undefined);
    expect(pairs).toHaveLength(2);
  });
});
