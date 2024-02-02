// Integration tests for HydraDxDex

import { describe, expect, it } from 'vitest';
import { type TTransferOptionsModified } from '../../types';
import HydraDxExchangeNode from './HydraDxDex';
import { MOCK_TRANSFER_OPTIONS, performSwap } from '../../utils/utils.test';

describe('HydraDxDex - integration', () => {
  it('should build a transfer extrinsic without error on HydraDx', async () => {
    const dex = new HydraDxExchangeNode('HydraDX');
    const options: TTransferOptionsModified = {
      ...MOCK_TRANSFER_OPTIONS,
      currencyFrom: 'ASTR',
      currencyTo: 'DOT',
      amount: '38821036538894063687',
      to: 'BifrostPolkadot',
      exchange: 'HydraDX',
      from: 'Astar',
    };
    const tx = await performSwap(options, dex);
    expect(tx).toBeDefined();
  });

  it('should build a transfer extrinsic without error on Basilisk', async () => {
    const dex = new HydraDxExchangeNode('Basilisk');
    const options: TTransferOptionsModified = {
      ...MOCK_TRANSFER_OPTIONS,
      currencyFrom: 'KSM',
      currencyTo: 'USDT',
      amount: '1000000000000',
      to: 'Karura',
      exchange: 'Basilisk',
      from: 'Kusama',
    };
    const tx = await performSwap(options, dex);
    expect(tx).toBeDefined();
  });

  it('should return asset symbols', async () => {
    const dex = new HydraDxExchangeNode('HydraDX');
    const api = await dex.createApiInstance();
    const symbols = await dex.getAssetSymbols(api);
    expect(symbols.length).toBeGreaterThan(0);
  });
});
