import { type Asset, type TradeRouter } from '@galacticcouncil/sdk';
import type { TAssetInfo, TChain } from '@paraspell/sdk';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { TRouterAsset } from '../../../types';
import { getAssetInfo } from './utils';

vi.mock('@paraspell/sdk-pjs', async () => {
  const originalModule = await vi.importActual('@paraspell/sdk-pjs');
  return {
    ...originalModule,
    getAssetDecimals: (_chain: TChain, symbol: string): number | null => {
      if (symbol === 'HDX') return 12;
      if (symbol === 'BSX') return 12;
      return null;
    },
  };
});

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

    const currency = { symbol: 'BTC' } as TAssetInfo;
    const asset = await getAssetInfo(mockTradeRouter, currency);

    expect(asset).toEqual(mockAssets[0]);
    expect(spy).toHaveBeenCalledOnce();
  });

  it('should return asset by id if found', async () => {
    const spy = vi.spyOn(mockTradeRouter, 'getAllAssets').mockResolvedValue(mockAssets);

    const currency: TRouterAsset = {
      symbol: 'HDX',
      decimals: 12,
      assetId: '2',
      location: { parents: 0, interior: 'Here' },
    };
    const asset = await getAssetInfo(mockTradeRouter, currency);

    expect(asset).toEqual(mockAssets[1]);
    expect(spy).toHaveBeenCalledOnce();
  });

  it('should return undefined if asset is not found', async () => {
    const spy = vi.spyOn(mockTradeRouter, 'getAllAssets').mockResolvedValue(mockAssets);

    const currency = { symbol: 'XRP' } as TAssetInfo;
    const asset = await getAssetInfo(mockTradeRouter, currency);

    expect(asset).toBeUndefined();
    expect(spy).toHaveBeenCalledOnce();
  });
});
