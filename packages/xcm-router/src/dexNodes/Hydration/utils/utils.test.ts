import { type Asset, bnum, type TradeRouter } from '@galacticcouncil/sdk';
import type { TAsset, TNode } from '@paraspell/sdk-pjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { TRouterAsset } from '../../../types';
import { calculateSlippage, getAssetInfo, getMinAmountOut } from './utils';

describe('getAssetInfo', () => {
  const mockAssets: Asset[] = [
    { id: '1', symbol: 'BTC' } as unknown as Asset,
    { id: '2', symbol: 'ETH' } as unknown as Asset,
    { id: '3', symbol: 'ADA' } as unknown as Asset,
  ];

  const mockTradeRouter = {
    getAllAssets: vi.fn(),
  } as unknown as TradeRouter;

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('should return asset by symbol if found', async () => {
    const spy = vi.spyOn(mockTradeRouter, 'getAllAssets').mockResolvedValue(mockAssets);

    const currency = { symbol: 'BTC' } as TAsset;
    const asset = await getAssetInfo(mockTradeRouter, currency);

    expect(asset).toEqual(mockAssets[0]);
    expect(spy).toHaveBeenCalledOnce();
  });

  it('should return asset by id if found', async () => {
    const spy = vi.spyOn(mockTradeRouter, 'getAllAssets').mockResolvedValue(mockAssets);

    const currency: TRouterAsset = { symbol: 'HDX', assetId: '2' };
    const asset = await getAssetInfo(mockTradeRouter, currency);

    expect(asset).toEqual(mockAssets[1]);
    expect(spy).toHaveBeenCalledOnce();
  });

  it('should return undefined if asset is not found', async () => {
    const spy = vi.spyOn(mockTradeRouter, 'getAllAssets').mockResolvedValue(mockAssets);

    const currency: TAsset = { symbol: 'XRP' } as TAsset; // Non-existent symbol
    const asset = await getAssetInfo(mockTradeRouter, currency);

    expect(asset).toBeUndefined();
    expect(spy).toHaveBeenCalledOnce();
  });
});

vi.mock('@paraspell/sdk-pjs', async () => {
  const originalModule = await vi.importActual('@paraspell/sdk-pjs');
  return {
    ...originalModule,
    getAssetDecimals: (_node: TNode, symbol: string): number | null => {
      if (symbol === 'HDX') return 12;
      if (symbol === 'BSX') return 12;
      return null;
    },
  };
});

describe('calculateSlippage', () => {
  it('should calculate slippage correctly (simple test)', () => {
    const amount = bnum('1000');
    const slippagePct = '1'; // 1%
    // slippage = 1000 / 100 * 1 = 10
    // returns decimalPlaces(0, 1) => 10
    const result = calculateSlippage(amount, slippagePct);
    expect(result.toString()).toBe('10');
  });

  it('should return 0 if slippagePct is 0', () => {
    const amount = bnum('1000');
    const slippagePct = '0'; // 0%
    const result = calculateSlippage(amount, slippagePct);
    expect(result.toString()).toBe('0');
  });

  it('should handle large slippagePct', () => {
    const amount = bnum('1000');
    const slippagePct = '50'; // 50%
    // slippage = 1000 / 100 * 50 = 500
    const result = calculateSlippage(amount, slippagePct);
    expect(result.toString()).toBe('500');
  });
});

describe('getMinAmountOut', () => {
  it('should calculate minAmountOut with no slippage', () => {
    const amountOut = bnum('1000');
    const decimals = 12;
    const slippagePct = '0';
    const { amount, decimals: resultDecimals } = getMinAmountOut(amountOut, decimals, slippagePct);
    expect(amount.toString()).toBe('1000');
    expect(resultDecimals).toBe(decimals);
  });

  it('should calculate minAmountOut with slippage', () => {
    const amountOut = bnum('1000');
    const decimals = 12;
    const slippagePct = '5'; // 5%
    // slippage = 1000 * (5/100) = 50
    // minAmountOut = 1000 - 50 = 950
    const { amount, decimals: resultDecimals } = getMinAmountOut(amountOut, decimals, slippagePct);
    expect(amount.toString()).toBe('950');
    expect(resultDecimals).toBe(decimals);
  });
});
