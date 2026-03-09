import type { TAssetInfo, TLocation } from '@paraspell/sdk';
import { describe, expect, it, vi } from 'vitest';

import { getExchangePairs } from './getExchangePairs';

const locA: TLocation = { parents: 1, interior: 'Here' };
const locB: TLocation = { parents: 1, interior: { X1: [{ Parachain: 1000 }] } };
const altLocation: TLocation = { parents: 1, interior: { X1: [{ Parachain: 2000 }] } };

const assetA: TAssetInfo = {
  symbol: 'ABC',
  decimals: 12,
  assetId: '1',
  location: locA,
};

const assetB: TAssetInfo = {
  symbol: 'XYZ',
  decimals: 12,
  assetId: '2',
  location: locB,
};

vi.mock('@paraspell/sdk', async (importActual) => ({
  ...(await importActual()),
  EXCHANGE_CHAINS: ['HydrationDex', 'AssetHubPolkadotDex'],
  deepEqual: (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b),
  reverseTransformLocation: vi.fn((loc: unknown) =>
    JSON.stringify(loc) === JSON.stringify(altLocation) ? locA : loc,
  ),
}));

const mockConfigs = {
  HydrationDex: {
    isOmni: true,
    assets: [assetA, assetB],
    pairs: [],
  },
  AssetHubPolkadotDex: {
    isOmni: false,
    assets: [assetA, assetB],
    pairs: [[altLocation, locB]],
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
