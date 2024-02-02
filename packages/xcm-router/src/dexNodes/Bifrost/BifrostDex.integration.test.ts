// Integration tests for BifrostDex

import { describe, expect, it } from 'vitest';
import BifrostExchangeNode from './BifrostDex';
import { type TTransferOptionsModified } from '../../types';
import { MOCK_TRANSFER_OPTIONS, performSwap } from '../../utils/utils.test';

describe('BifrostDex - integration', () => {
  it('should build a transfer extrinsic without error on Bifrost Polkadot', async () => {
    const dex = new BifrostExchangeNode('BifrostPolkadot');
    const options: TTransferOptionsModified = {
      ...MOCK_TRANSFER_OPTIONS,
      currencyFrom: 'DOT',
      currencyTo: 'BNC',
      amount: '5000000000',
      to: 'Polkadot',
      exchange: 'BifrostPolkadot',
      from: 'HydraDX',
    };
    const tx = await performSwap(options, dex);
    expect(tx).toBeDefined();
  });

  it('should build a transfer extrinsic without error on Bifrost Kusama', async () => {
    const dex = new BifrostExchangeNode('BifrostKusama');
    const options: TTransferOptionsModified = {
      ...MOCK_TRANSFER_OPTIONS,
      currencyFrom: 'KAR',
      currencyTo: 'KSM',
      amount: '100000000000000',
      to: 'Karura',
      exchange: 'BifrostKusama',
      from: 'Kusama',
    };
    const tx = await performSwap(options, dex);
    expect(tx).toBeDefined();
  });

  it('should return asset symbols', async () => {
    const dex = new BifrostExchangeNode('BifrostPolkadot');
    const api = await dex.createApiInstance();
    const symbols = await dex.getAssetSymbols(api);
    expect(symbols.length).toBeGreaterThan(0);
  });
});
