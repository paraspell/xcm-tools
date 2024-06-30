// Integration tests for BifrostDex

import { describe, expect, it } from 'vitest';
import BifrostExchangeNode from './BifrostDex';
import { testSwap } from '../Hydration/HydrationDex.integration.test';
import { SmallAmountError } from '../../errors/SmallAmountError';

describe('BifrostDex - integration', () => {
  it('should build a transfer extrinsic without error on Bifrost Polkadot', async () => {
    const dex = new BifrostExchangeNode('BifrostPolkadot');
    await testSwap(dex, 'BifrostPolkadot', 'DOT', 'BNC', '5000000000', 'Polkadot', 'Hydration');
  });

  it('should build a transfer extrinsic without error on Bifrost Kusama', async () => {
    const dex = new BifrostExchangeNode('BifrostKusama');
    await testSwap(dex, 'BifrostKusama', 'KAR', 'KSM', '100000000000000', 'Karura', 'Kusama');
  });

  it('should return asset symbols', async () => {
    const dex = new BifrostExchangeNode('BifrostPolkadot');
    const api = await dex.createApiInstance();
    const symbols = await dex.getAssetSymbols(api);
    expect(symbols.length).toBeGreaterThan(0);
  });

  it('should throw SmallAmountError when the amount is too small to cover fees', async () => {
    const dex = new BifrostExchangeNode('BifrostPolkadot');
    await expect(
      testSwap(dex, 'BifrostPolkadot', 'DOT', 'BNC', '100', 'Polkadot', 'Hydration'),
    ).rejects.toThrow(SmallAmountError);
  });
});
