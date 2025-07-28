import type { TAssetInfo, TNodeWithRelayChains } from '@paraspell/sdk';
import { getAssets, normalizeSymbol } from '@paraspell/sdk';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type ExchangeNode from '../dexNodes/DexNode';
import { createDexNodeInstance } from '../dexNodes/DexNodeFactory';
import type { TExchangeNode } from '../types';
import { getExchangeAssets } from './getExchangeConfig';
import { getSupportedAssetsFrom } from './getSupportedAssetsFrom';

vi.mock('@paraspell/sdk', () => ({
  getAssets: vi.fn(),
  normalizeSymbol: vi.fn((symbol: string) => symbol.toLowerCase()),
}));

vi.mock('../dexNodes/DexNodeFactory', () => ({
  createDexNodeInstance: vi.fn(),
}));

vi.mock('./getExchangeConfig', () => ({
  getExchangeAssets: vi.fn(),
}));

describe('getSupportedAssetsFrom', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return assets from exchange that match node assets', () => {
    const fromNode = 'Acala' as TNodeWithRelayChains;
    const exchange: TExchangeNode = 'HydrationDex';

    const exchangeNode = 'Hydration';
    vi.mocked(createDexNodeInstance).mockReturnValue({
      node: exchangeNode,
    } as ExchangeNode);

    const exchangeAssets: TAssetInfo[] = [
      { symbol: 'HDX', assetId: '123' },
      { symbol: 'WUD', assetId: '1000085' },
    ];
    vi.mocked(getExchangeAssets).mockReturnValue(exchangeAssets);

    const fromAssets: TAssetInfo[] = [
      { symbol: 'WUD', assetId: '1000085' },
      { symbol: 'ACA', assetId: '999' },
    ];
    vi.mocked(getAssets).mockReturnValue(fromAssets);

    const result = getSupportedAssetsFrom(fromNode, exchange);

    expect(result).toEqual([{ symbol: 'WUD', assetId: '1000085' }]);
  });

  it('should return all assets from node when exchange is auto select', () => {
    const fromNode = 'Acala' as TNodeWithRelayChains;
    const exchange = undefined;
    const fromAssets: TAssetInfo[] = [{ symbol: 'ACA', assetId: '1000099' }];
    vi.mocked(getAssets).mockReturnValue(fromAssets);

    const result = getSupportedAssetsFrom(fromNode, exchange);
    expect(result).toEqual(fromAssets);
  });

  it('should return exchange assets when from node is same as exchange node', () => {
    const fromNode = 'Hydration' as TNodeWithRelayChains;
    const exchange: TExchangeNode = 'HydrationDex';

    vi.mocked(createDexNodeInstance).mockReturnValue({
      node: fromNode,
    } as ExchangeNode);

    const exchangeAssets: TAssetInfo[] = [{ symbol: 'HDX', assetId: '123' }];
    vi.mocked(getExchangeAssets).mockReturnValue(exchangeAssets);

    const result = getSupportedAssetsFrom(fromNode, exchange);

    expect(result).toEqual(exchangeAssets);
    expect(getAssets).not.toHaveBeenCalled();
  });

  it('should return exchange assets when from is undefined', () => {
    const exchange: TExchangeNode = 'HydrationDex';

    vi.mocked(createDexNodeInstance).mockReturnValue({
      node: 'Hydration',
    } as ExchangeNode);

    const exchangeAssets: TAssetInfo[] = [{ symbol: 'HDX', assetId: '123' }];
    vi.mocked(getExchangeAssets).mockReturnValue(exchangeAssets);

    const result = getSupportedAssetsFrom(undefined, exchange);

    expect(result).toEqual(exchangeAssets);
  });

  it('should match assets with different symbol cases after normalization', () => {
    const fromNode = 'Acala' as TNodeWithRelayChains;
    const exchange: TExchangeNode = 'HydrationDex';

    vi.mocked(createDexNodeInstance).mockReturnValue({
      node: 'Hydration',
    } as ExchangeNode);

    const exchangeAssets: TAssetInfo[] = [{ symbol: 'usdt', assetId: '123' }];
    vi.mocked(getExchangeAssets).mockReturnValue(exchangeAssets);

    const fromAssets: TAssetInfo[] = [{ symbol: 'USDT', assetId: '456' }];
    vi.mocked(getAssets).mockReturnValue(fromAssets);

    const result = getSupportedAssetsFrom(fromNode, exchange);

    expect(result).toEqual(fromAssets);
    expect(normalizeSymbol).toHaveBeenCalledWith('usdt');
    expect(normalizeSymbol).toHaveBeenCalledWith('USDT');
  });

  it('should return empty array when no assets match between node and exchange', () => {
    const fromNode = 'Acala' as TNodeWithRelayChains;
    const exchange: TExchangeNode = 'HydrationDex';

    vi.mocked(createDexNodeInstance).mockReturnValue({
      node: 'Hydration',
    } as ExchangeNode);

    const exchangeAssets: TAssetInfo[] = [{ symbol: 'HDX', assetId: '123' }];
    vi.mocked(getExchangeAssets).mockReturnValue(exchangeAssets);

    const fromAssets: TAssetInfo[] = [{ symbol: 'ACA', assetId: '456' }];
    vi.mocked(getAssets).mockReturnValue(fromAssets);

    const result = getSupportedAssetsFrom(fromNode, exchange);

    expect(result).toEqual([]);
  });

  it('should return empty array when exchange is Auto select and from is undefined', () => {
    const exchange = undefined;
    const result = getSupportedAssetsFrom(undefined, exchange);

    expect(result).toEqual([]);
    expect(getAssets).not.toHaveBeenCalled();
  });
});
