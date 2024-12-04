// Integration tests for BifrostDex

import { describe, expect, it } from 'vitest';
import BifrostExchangeNode from './BifrostDex';
import { testSwap } from '../Hydration/HydrationDex.test';
import { SmallAmountError } from '../../errors/SmallAmountError';

describe('BifrostDex - integration', () => {
  it('should build a transfer extrinsic without error on Bifrost Polkadot', async () => {
    const dex = new BifrostExchangeNode('BifrostPolkadot', 'BifrostPolkadotDex');
    await testSwap(
      dex,
      'BifrostPolkadot',
      { symbol: 'BNC' },
      { symbol: 'DOT' },
      '100000000000000',
      'Acala',
      'Hydration',
    );
  });

  it('should build a transfer extrinsic without error on Bifrost Kusama', async () => {
    const dex = new BifrostExchangeNode('BifrostKusama', 'BifrostKusamaDex');
    await testSwap(
      dex,
      'BifrostKusama',
      { symbol: 'KSM' },
      { symbol: 'KAR' },
      '100000000000000',
      'Karura',
      'Kusama',
    );
  });

  it('should return asset symbols', async () => {
    const dex = new BifrostExchangeNode('BifrostPolkadot', 'BifrostPolkadotDex');
    const api = await dex.createApiInstance();
    const assets = await dex.getAssets(api);
    expect(assets.length).toBeGreaterThan(0);
    assets.forEach((asset) => {
      expect(asset.symbol).toBeDefined();
      expect(asset.symbol).not.toBeNull();
      expect(asset).toHaveProperty('symbol');
    });
  });

  it('should throw SmallAmountError when the amount is too small to cover fees', async () => {
    const dex = new BifrostExchangeNode('BifrostPolkadot', 'BifrostPolkadotDex');
    await expect(
      testSwap(
        dex,
        'BifrostPolkadot',
        { symbol: 'BNC' },
        { symbol: 'DOT' },
        '100',
        'Acala',
        'Hydration',
      ),
    ).rejects.toThrow(SmallAmountError);
  });
});
