// Integration tests for InterlayDex

import { describe, expect, it } from 'vitest';
import InterlayExchangeNode from './InterlayDex';
import { testSwap } from '../Hydration/HydrationDex.test';
import { type ApiPromise } from '@polkadot/api';
import { SmallAmountError } from '../../errors/SmallAmountError';

describe('InterlayDex - integration', () => {
  it('should build a transfer extrinsic without error', async () => {
    const dex = new InterlayExchangeNode('Interlay', 'InterlayDex');
    await testSwap(
      dex,
      'Interlay',
      { symbol: 'DOT' },
      { symbol: 'INTR' },
      '5000000000',
      'Acala',
      'Polkadot',
    );
  });

  it('should build a transfer extrinsic without error on Kintsugi', async () => {
    const dex = new InterlayExchangeNode('Kintsugi', 'KintsugiDex');
    await testSwap(
      dex,
      'Kintsugi',
      { symbol: 'KSM' },
      { symbol: 'KINT' },
      '5000000000',
      'Karura',
      'Kusama',
    );
  });

  it('should return asset symbols', async () => {
    const dex = new InterlayExchangeNode('Interlay', 'InterlayDex');
    const api: ApiPromise = await dex.createApiInstance();
    const assets = await dex.getAssets(api);
    expect(assets.length).toBeGreaterThan(0);
    assets.forEach((asset) => {
      expect(asset.symbol).toBeDefined();
      expect(asset.symbol).not.toBeNull();
      expect(asset).toHaveProperty('symbol');
      expect(asset).toHaveProperty('id');
    });
  });

  it('should throw SmallAmountError when the amount is too small to cover fees', async () => {
    const dex = new InterlayExchangeNode('Interlay', 'InterlayDex');
    await expect(
      testSwap(dex, 'Interlay', { symbol: 'DOT' }, { symbol: 'INTR' }, '100', 'Acala', 'Polkadot'),
    ).rejects.toThrow(SmallAmountError);
  });
});
