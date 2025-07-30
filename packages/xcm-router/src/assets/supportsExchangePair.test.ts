import type { TLocation } from '@paraspell/sdk';
import { describe, expect, it, vi } from 'vitest';

import type { TRouterAsset } from '../types';
import { supportsExchangePair } from './supportsExchangePair';

const mlA = { foo: 'bar' } as unknown as TLocation;
const mlB = { baz: 'qux' } as unknown as TLocation;

const assetA: TRouterAsset = { symbol: 'ABC', assetId: '1', location: mlA };
const assetA_alt: TRouterAsset = { symbol: 'abc', assetId: '1', location: mlA };
const assetB: TRouterAsset = { symbol: 'XYZ', assetId: '2', location: mlB };
const assetC: TRouterAsset = { symbol: 'ZZZ', assetId: '9' };

vi.mock('@paraspell/sdk', () => ({
  deepEqual: (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b),
  normalizeSymbol: (s: string) => s.toLowerCase(),
}));

vi.mock('../consts', () => ({
  EXCHANGE_CHAINS: ['AcalaDex', 'BifrostPolkadotDex'],
}));

const mockConfigs = {
  HydrationDex: { isOmni: true, pairs: [] },
  AcalaDex: { isOmni: false, pairs: [[assetA, assetB]] },
  BifrostPolkadotDex: { isOmni: false, pairs: [[assetA_alt, assetB]] },
  AssetHubKusamaDex: { isOmni: false, pairs: [] },
};

vi.mock('./getExchangeConfig', () => ({
  getExchangeConfig: (ex: string) => mockConfigs[ex as keyof typeof mockConfigs],
}));

vi.mock('./getExchangePairs', () => ({
  getExchangePairs: (ex: string) => mockConfigs[ex as keyof typeof mockConfigs].pairs,
}));

describe('supportsExchangePair', () => {
  it('always returns true for an omni exchange', () => {
    expect(supportsExchangePair('HydrationDex', assetC, assetB)).toBe(true);
  });

  it('recognises a supported pair on a normal exchange (symbol & assetId)', () => {
    expect(supportsExchangePair('AcalaDex', assetA, assetB)).toBe(true);
    expect(supportsExchangePair('AcalaDex', assetB, assetA)).toBe(true);
  });

  it('matches assets via location deep equality', () => {
    const alt = { symbol: 'DIFF', location: mlA };
    expect(supportsExchangePair('AcalaDex', alt, assetB)).toBe(true);
  });

  it('ignores assetId equality on Bifrost exchanges, uses normalized symbol instead', () => {
    expect(supportsExchangePair('BifrostPolkadotDex', assetA, assetB)).toBe(true);
  });

  it('returns true when ANY exchange in the array supports the pair', () => {
    expect(supportsExchangePair(['AssetHubKusamaDex', 'AcalaDex'], assetA, assetB)).toBe(true);
  });

  it('falls back to EXCHANGE_CHAINS when exchange arg is undefined', () => {
    expect(supportsExchangePair(undefined, assetA, assetB)).toBe(true);
  });

  it('returns false when no exchange lists the pair', () => {
    expect(supportsExchangePair('AssetHubKusamaDex', assetA, assetB)).toBe(false);
  });
});
