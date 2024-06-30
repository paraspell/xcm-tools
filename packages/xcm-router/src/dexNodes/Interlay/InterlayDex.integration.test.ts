// Integration tests for InterlayDex

import { describe, expect, it } from 'vitest';
import InterlayExchangeNode from './InterlayDex';
import { testSwap } from '../HydraDx/HydraDxDex.integration.test';
import { type ApiPromise } from '@polkadot/api';
import { SmallAmountError } from '../../errors/SmallAmountError';

describe('InterlayDex - integration', () => {
  it('should build a transfer extrinsic without error', async () => {
    const dex = new InterlayExchangeNode('Interlay');
    await testSwap(dex, 'Interlay', 'DOT', 'INTR', '5000000000', 'Acala', 'Polkadot');
  });

  it('should build a transfer extrinsic without error on Kintsugi', async () => {
    const dex = new InterlayExchangeNode('Kintsugi');
    await testSwap(dex, 'Kintsugi', 'KSM', 'KINT', '5000000000', 'Karura', 'Kusama');
  });

  it('should return asset symbols', async () => {
    const dex = new InterlayExchangeNode('Interlay');
    const api: ApiPromise = await dex.createApiInstance();
    const symbols = await dex.getAssetSymbols(api);
    expect(symbols.length).toBeGreaterThan(0);
  });

  it('should throw SmallAmountError when the amount is too small to cover fees', async () => {
    const dex = new InterlayExchangeNode('Interlay');
    await expect(
      testSwap(dex, 'Interlay', 'DOT', 'INTR', '100', 'Acala', 'Polkadot'),
    ).rejects.toThrow(SmallAmountError);
  });
});
