import { describe, expect, it, vi } from 'vitest';

import { getExchangeAssets, getExchangeConfig } from './getExchangeConfig';

vi.mock('../consts/assets.json', () => ({
  HydrationDex: {
    isOmni: true,
    assets: [
      { symbol: 'ABC', assetId: '1' },
      { symbol: 'XYZ', assetId: '2' },
    ],
    pairs: [['1', '2']],
  },
}));

describe('exchange-config helpers', () => {
  it('getExchangeConfig → returns the config object for a known exchange', () => {
    const cfg = getExchangeConfig('HydrationDex');

    expect(cfg).toEqual({
      isOmni: true,
      assets: [
        { symbol: 'ABC', assetId: '1' },
        { symbol: 'XYZ', assetId: '2' },
      ],
      pairs: [['1', '2']],
    });
    expect(cfg.assets[0].symbol).toBe('ABC');
  });

  it('getExchangeAssets → returns the assets array for the exchange', () => {
    const assets = getExchangeAssets('HydrationDex');

    expect(assets).toEqual([
      { symbol: 'ABC', assetId: '1' },
      { symbol: 'XYZ', assetId: '2' },
    ]);
    expect(Array.isArray(assets)).toBe(true);
  });
});
