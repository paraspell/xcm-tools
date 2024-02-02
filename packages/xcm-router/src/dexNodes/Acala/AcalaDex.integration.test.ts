// Integration tests for AcalaDex

import { describe, expect, it } from 'vitest';
import AcalaExchangeNode from './AcalaDex';
import { type TTransferOptionsModified } from '../../types';
import { MOCK_ADDRESS, MOCK_TRANSFER_OPTIONS, performSwap } from '../../utils/utils.test';

describe('AcalaDex - integration', () => {
  it('should build a transfer extrinsic without error on Acala', async () => {
    const dex = new AcalaExchangeNode('Acala');
    const transferOptions: TTransferOptionsModified = {
      ...MOCK_TRANSFER_OPTIONS,
      currencyFrom: 'DOT',
      currencyTo: 'ACA',
      amount: '5000000000',
      to: 'Astar',
      exchange: 'Acala',
      from: 'Polkadot',
      recipientAddress: MOCK_ADDRESS,
    };
    const tx = await performSwap(transferOptions, dex);
    expect(tx).toBeDefined();
  });

  it('should build a transfer extrinsic without error on Karura', async () => {
    const dex = new AcalaExchangeNode('Karura');
    const options: TTransferOptionsModified = {
      ...MOCK_TRANSFER_OPTIONS,
      currencyFrom: 'KSM',
      currencyTo: 'BNC',
      amount: '22000000000000',
      to: 'BifrostKusama',
      exchange: 'Karura',
      from: 'Kusama',
      recipientAddress: MOCK_ADDRESS,
    };
    const tx = await performSwap(options, dex);
    expect(tx).toBeDefined();
  });

  it('should return asset symbols', async () => {
    const dex = new AcalaExchangeNode('Acala');
    const api = await dex.createApiInstance();
    const symbols = await dex.getAssetSymbols(api);
    expect(symbols.length).toBeGreaterThan(0);
  });
});
