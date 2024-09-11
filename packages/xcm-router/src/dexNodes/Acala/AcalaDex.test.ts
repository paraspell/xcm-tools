import { describe, it, expect } from 'vitest';
import AcalaExchangeNode from './AcalaDex';
import { type ApiPromise } from '@polkadot/api';
import { testSwap } from '../Hydration/HydrationDex.test';
import { SmallAmountError } from '../../errors/SmallAmountError';

describe('AcalaDex - integration', () => {
  it('should build a transfer extrinsic without error for DOT to ACA on Acala', async () => {
    const dex = new AcalaExchangeNode('Acala', 'AcalaDex');
    await testSwap(
      dex,
      'Acala',
      { symbol: 'DOT' },
      { symbol: 'ACA' },
      '5000000000',
      'Astar',
      'Polkadot',
    );
  });

  it('should build a transfer extrinsic without error for KSM to BNC on Karura', async () => {
    const dex = new AcalaExchangeNode('Karura', 'KaruraDex');
    await testSwap(
      dex,
      'Karura',
      { symbol: 'KSM' },
      { symbol: 'BNC' },
      '22000000000000',
      'BifrostKusama',
      'Kusama',
    );
  });

  it('should retrieve asset symbols from Acala', async () => {
    const dex = new AcalaExchangeNode('Acala', 'AcalaDex');
    const api: ApiPromise = await dex.createApiInstance();
    const symbols = await dex.getAssets(api);
    expect(symbols.length).toBeGreaterThan(0);
  });

  it('should throw SmallAmountError when the amount is too small to cover fees', async () => {
    const dex = new AcalaExchangeNode('Acala', 'AcalaDex');
    await expect(
      testSwap(dex, 'Acala', { symbol: 'DOT' }, { symbol: 'ACA' }, '100', 'Astar', 'Polkadot'),
    ).rejects.toThrow(SmallAmountError);
  });
});
