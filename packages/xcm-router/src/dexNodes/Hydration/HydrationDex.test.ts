// Integration tests for HydrationExchangeNodeDex

import { describe, expect, it } from 'vitest';
import { type TTransferOptionsModified } from '../../types';
import HydrationExchangeNode from './HydrationDex';
import { MOCK_TRANSFER_OPTIONS, performSwap } from '../../utils/utils.test';
import type { TCurrencyCoreV1, TNodePolkadotKusama } from '@paraspell/sdk-pjs';
import { type TNodeWithRelayChains } from '@paraspell/sdk-pjs';
import { SmallAmountError } from '../../errors/SmallAmountError';
import type ExchangeNode from '../DexNode';
import { findAssetFrom, findAssetTo } from '../../assets/assets';

export async function testSwap(
  dex: ExchangeNode,
  exchange: TNodePolkadotKusama,
  currencyFrom: TCurrencyCoreV1,
  currencyTo: TCurrencyCoreV1,
  amount: string,
  to: TNodeWithRelayChains,
  from: TNodeWithRelayChains,
  checkTx = true,
): Promise<void> {
  const assetFrom = findAssetFrom(from, dex.exchangeNode, currencyFrom);

  if (!assetFrom && 'id' in currencyFrom) {
    throw new Error(`Currency from ${JSON.stringify(currencyFrom)} not found in ${from}.`);
  }

  const assetTo = findAssetTo(dex.exchangeNode, from, to, currencyTo, exchange === undefined);

  if (!assetTo && 'id' in currencyTo) {
    throw new Error(`Currency to ${JSON.stringify(currencyTo)} not found in ${from}.`);
  }

  const options: TTransferOptionsModified = {
    ...MOCK_TRANSFER_OPTIONS,
    currencyFrom,
    currencyTo,
    assetFrom,
    assetTo,
    amount,
    to,
    exchangeNode: exchange,
    from,
  };
  const tx = await performSwap(options, dex);
  if (checkTx) expect(tx).toBeDefined();
}

describe('HydrationDex - integration', () => {
  it('should build a transfer extrinsic without error on Hydration', async () => {
    const dex = new HydrationExchangeNode('Hydration', 'HydrationDex');
    await testSwap(
      dex,
      'Hydration',
      { symbol: 'ASTR' },
      { symbol: 'BNC' },
      '38821036538894063687',
      'BifrostPolkadot',
      'Astar',
    );
  });

  it('should return asset symbols', async () => {
    const dex = new HydrationExchangeNode('Hydration', 'HydrationDex');
    const api = await dex.createApiInstance();
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
    const dex = new HydrationExchangeNode('Hydration', 'HydrationDex');
    await expect(
      testSwap(
        dex,
        'Hydration',
        { symbol: 'ASTR' },
        { symbol: 'BNC' },
        '100',
        'BifrostPolkadot',
        'Astar',
      ),
    ).rejects.toThrow(SmallAmountError);
  });
});
