import type { TAssetInfo, TLocation } from '@paraspell/sdk';
import { describe, expect, it, vi } from 'vitest';

import { supportsExchangePair } from './supportsExchangePair';

const mlA = { foo: 'bar' } as unknown as TLocation;
const mlB = { baz: 'qux' } as unknown as TLocation;
const mlc = { quux: 'corge' } as unknown as TLocation;

const assetA: TAssetInfo = { symbol: 'ABC', assetId: '1', location: mlA, decimals: 12 };
const assetA_alt: TAssetInfo = { symbol: 'abc', assetId: '1', location: mlA, decimals: 12 };
const assetB: TAssetInfo = { symbol: 'XYZ', assetId: '2', location: mlB, decimals: 12 };
const assetC: TAssetInfo = { symbol: 'ZZZ', assetId: '9', decimals: 12, location: mlc };

vi.mock('@paraspell/sdk', async (importActual) => ({
  ...(await importActual()),
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
    const alt = { symbol: 'DIFF', location: mlA, decimals: 12 };
    expect(supportsExchangePair('AcalaDex', alt, assetB)).toBe(true);
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
