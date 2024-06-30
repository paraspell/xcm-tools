// Integration tests for HydraDxDex

import { describe, expect, it } from 'vitest';
import { type TTransferOptionsModified } from '../../types';
import HydraDxExchangeNode from './HydraDxDex';
import { MOCK_TRANSFER_OPTIONS, performSwap } from '../../utils/utils.test';
import { type TNodeWithRelayChains, type TNode } from '@paraspell/sdk';
import { SmallAmountError } from '../../errors/SmallAmountError';
import type ExchangeNode from '../DexNode';

export async function testSwap(
  dex: ExchangeNode,
  exchange: TNode,
  currencyFrom: string,
  currencyTo: string,
  amount: string,
  to: TNodeWithRelayChains,
  from: TNodeWithRelayChains,
  checkTx = true,
): Promise<void> {
  const options: TTransferOptionsModified = {
    ...MOCK_TRANSFER_OPTIONS,
    currencyFrom,
    currencyTo,
    amount,
    to,
    exchange,
    from,
  };
  const tx = await performSwap(options, dex);
  if (checkTx) expect(tx).toBeDefined();
}

describe('HydraDxDex - integration', () => {
  it('should build a transfer extrinsic without error on HydraDx', async () => {
    const dex = new HydraDxExchangeNode('HydraDX');
    await testSwap(
      dex,
      'HydraDX',
      'ASTR',
      'DOT',
      '38821036538894063687',
      'BifrostPolkadot',
      'Astar',
    );
  });

  it('should build a transfer extrinsic without error on Basilisk', async () => {
    const dex = new HydraDxExchangeNode('Basilisk');
    await testSwap(dex, 'Basilisk', 'KSM', 'USDT', '1000000000000', 'Karura', 'Kusama');
  });

  it('should return asset symbols', async () => {
    const dex = new HydraDxExchangeNode('HydraDX');
    const api = await dex.createApiInstance();
    const symbols = await dex.getAssetSymbols(api);
    expect(symbols.length).toBeGreaterThan(0);
  });

  it('should throw SmallAmountError when the amount is too small to cover fees', async () => {
    const dex = new HydraDxExchangeNode('HydraDX');
    await expect(
      testSwap(dex, 'HydraDX', 'ASTR', 'DOT', '100', 'BifrostPolkadot', 'Astar'),
    ).rejects.toThrow(SmallAmountError);
  });
});
