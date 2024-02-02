// Integration tests for InterlayDex

import { describe, expect, it } from 'vitest';
import { type TTransferOptionsModified } from '../../types';
import InterlayExchangeNode from './InterlayDex';
import { MOCK_TRANSFER_OPTIONS, performSwap } from '../../utils/utils.test';

describe('InterlayDex - integration', () => {
  it('should build a transfer extrinsic without error', async () => {
    const dex = new InterlayExchangeNode('Interlay');
    const options: TTransferOptionsModified = {
      ...MOCK_TRANSFER_OPTIONS,
      currencyFrom: 'DOT',
      currencyTo: 'INTR',
      amount: '5000000000',
      to: 'Acala',
      exchange: 'Interlay',
      from: 'Polkadot',
    };
    const tx = await performSwap(options, dex);
    expect(tx).toBeDefined();
  });

  it('should build a transfer extrinsic without error on kintsugi', async () => {
    const dex = new InterlayExchangeNode('Kintsugi');
    const options: TTransferOptionsModified = {
      ...MOCK_TRANSFER_OPTIONS,
      currencyFrom: 'KSM',
      currencyTo: 'KINT',
      amount: '5000000000',
      to: 'Karura',
      exchange: 'Kintsugi',
      from: 'Kusama',
    };
    const tx = await performSwap(options, dex);
    expect(tx).toBeDefined();
  });

  it('should return asset symbols', async () => {
    const dex = new InterlayExchangeNode('Interlay');
    const api = await dex.createApiInstance();
    const symbols = await dex.getAssetSymbols(api);
    expect(symbols.length).toBeGreaterThan(0);
  });
});
