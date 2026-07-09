import type { Asset } from '@galacticcouncil/sdk-next';
import type { AssetClient } from '@galacticcouncil/sdk-next/client';
import type { TAssetInfo } from '@paraspell/sdk';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { getAssetInfo } from './utils';

describe('getAssetInfo', () => {
  const mockAssets: Asset[] = [
    { id: 1, symbol: 'BTC' } as Asset,
    { id: 2, symbol: 'ETH' } as Asset,
    { id: 3, symbol: 'ADA' } as Asset,
  ];

  const mockAssetClient = {
    getSupported: vi.fn(),
  } as unknown as AssetClient;

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('should return asset by symbol if found', async () => {
    const spy = vi.spyOn(mockAssetClient, 'getSupported').mockResolvedValue(mockAssets);

    const currency = { symbol: 'BTC' } as TAssetInfo;
    const asset = await getAssetInfo(mockAssetClient, currency);

    expect(asset).toEqual(mockAssets[0]);
    expect(spy).toHaveBeenCalledOnce();
  });

  it('should return asset by id if found', async () => {
    const spy = vi.spyOn(mockAssetClient, 'getSupported').mockResolvedValue(mockAssets);

    const currency: TAssetInfo = {
      symbol: 'HDX',
      decimals: 12,
      assetId: '2',
      location: { parents: 0, interior: 'Here' },
    };
    const asset = await getAssetInfo(mockAssetClient, currency);

    expect(asset).toEqual(mockAssets[1]);
    expect(spy).toHaveBeenCalledOnce();
  });

  it('should return undefined if asset is not found', async () => {
    const spy = vi.spyOn(mockAssetClient, 'getSupported').mockResolvedValue(mockAssets);

    const currency = { symbol: 'XRP' } as TAssetInfo;
    const asset = await getAssetInfo(mockAssetClient, currency);

    expect(asset).toBeUndefined();
    expect(spy).toHaveBeenCalledOnce();
  });
});
