import { describe, it, expect, vi, beforeEach } from 'vitest';
import { type Asset, type TradeRouter } from '@galacticcouncil/sdk';
import { type TCurrencyCore } from '@paraspell/sdk';
import { getAssetInfo } from './utils';

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

    const currency: TCurrencyCore = { symbol: 'BTC' };
    const asset = await getAssetInfo(mockTradeRouter, currency);

    expect(asset).toEqual(mockAssets[0]);
    expect(spy).toHaveBeenCalledOnce();
  });

  it('should return asset by id if found', async () => {
    const spy = vi.spyOn(mockTradeRouter, 'getAllAssets').mockResolvedValue(mockAssets);

    const currency: TCurrencyCore = { id: '2' };
    const asset = await getAssetInfo(mockTradeRouter, currency);

    expect(asset).toEqual(mockAssets[1]);
    expect(spy).toHaveBeenCalledOnce();
  });

  it('should return undefined if asset is not found', async () => {
    const spy = vi.spyOn(mockTradeRouter, 'getAllAssets').mockResolvedValue(mockAssets);

    const currency: TCurrencyCore = { symbol: 'XRP' }; // Non-existent symbol
    const asset = await getAssetInfo(mockTradeRouter, currency);

    expect(asset).toBeUndefined();
    expect(spy).toHaveBeenCalledOnce();
  });

  it('should throw an error if duplicate assets are found by symbol', async () => {
    const duplicateAssets = [
      { id: '1', symbol: 'BTC' } as unknown as Asset,
      { id: '4', symbol: 'BTC' } as unknown as Asset,
    ];
    vi.spyOn(mockTradeRouter, 'getAllAssets').mockResolvedValue(duplicateAssets);

    const currency: TCurrencyCore = { symbol: 'BTC' };

    await expect(getAssetInfo(mockTradeRouter, currency)).rejects.toThrow(
      'Duplicate currency found in HydrationDex.',
    );
  });

  it('should throw an error if duplicate assets are found by id', async () => {
    const duplicateAssets = [
      { id: '1', symbol: 'BTC' } as unknown as Asset,
      { id: '1', symbol: 'ETH' } as unknown as Asset,
    ];
    vi.spyOn(mockTradeRouter, 'getAllAssets').mockResolvedValue(duplicateAssets);

    const currency: TCurrencyCore = { id: '1' };

    await expect(getAssetInfo(mockTradeRouter, currency)).rejects.toThrow(
      'Duplicate currency found in HydrationDex.',
    );
  });
});
