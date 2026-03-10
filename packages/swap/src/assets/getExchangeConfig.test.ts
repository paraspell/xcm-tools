import type { TAssetInfo, TLocation } from '@paraspell/sdk';
import { findAssetInfoOrThrow } from '@paraspell/sdk';
import { describe, expect, it, vi } from 'vitest';

import { getExchangeAssets, getExchangeConfig } from './getExchangeConfig';

const { locA, locB } = vi.hoisted(() => {
  const locA: TLocation = { parents: 0, interior: 'Here' };
  const locB: TLocation = { parents: 1, interior: 'Here' };
  return { locA, locB };
});

vi.mock('../consts/assets.json', () => ({
  HydrationDex: {
    isOmni: true,
    assets: [locA, locB],
    pairs: [[locA, locB]],
  },
}));

vi.mock('../exchanges/ExchangeChainFactory', () => ({
  record: {
    HydrationDex: { chain: 'Hydration' },
  },
}));

vi.mock('@paraspell/sdk', async (importActual) => ({
  ...(await importActual()),
  findAssetInfoOrThrow: vi.fn(),
}));

const assetA: TAssetInfo = { symbol: 'ABC', assetId: '1', decimals: 12, location: locA };
const assetB: TAssetInfo = { symbol: 'XYZ', assetId: '2', decimals: 12, location: locB };

describe('exchange-config helpers', () => {
  it('getExchangeConfig → returns the config object for a known exchange', () => {
    vi.mocked(findAssetInfoOrThrow).mockImplementation((_chain, query) => {
      const loc = (query as { location: TLocation }).location;
      if (loc === locA) return assetA;
      if (loc === locB) return assetB;
      throw new Error('not found');
    });

    const cfg = getExchangeConfig('HydrationDex');

    expect(cfg).toEqual({
      isOmni: true,
      assets: [assetA, assetB],
      pairs: [[locA, locB]],
    });
    expect(cfg.assets[0].symbol).toBe('ABC');
  });

  it('getExchangeAssets → returns the assets array for the exchange', () => {
    vi.mocked(findAssetInfoOrThrow).mockImplementation((_chain, query) => {
      const loc = (query as { location: TLocation }).location;
      if (loc === locA) return assetA;
      if (loc === locB) return assetB;
      throw new Error('not found');
    });

    const assets = getExchangeAssets('HydrationDex');

    expect(assets).toEqual([assetA, assetB]);
    expect(Array.isArray(assets)).toBe(true);
  });
});
