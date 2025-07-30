import type { TAssetInfo, TSubstrateChain } from '@paraspell/sdk';
import { getAssets, normalizeSymbol } from '@paraspell/sdk';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type ExchangeChain from '../exchanges/ExchangeChain';
import { createExchangeInstance } from '../exchanges/ExchangeChainFactory';
import type { TExchangeChain } from '../types';
import { getExchangeAssets } from './getExchangeConfig';
import { getSupportedAssetsFrom } from './getSupportedAssetsFrom';

vi.mock('@paraspell/sdk', () => ({
  getAssets: vi.fn(),
  normalizeSymbol: vi.fn((symbol: string) => symbol.toLowerCase()),
}));

vi.mock('../exchanges/ExchangeChainFactory', () => ({
  createExchangeInstance: vi.fn(),
}));

vi.mock('./getExchangeConfig', () => ({
  getExchangeAssets: vi.fn(),
}));

describe('getSupportedAssetsFrom', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return assets from exchange that match chain assets', () => {
    const fromChain: TSubstrateChain = 'Acala';
    const exchange: TExchangeChain = 'HydrationDex';

    const exchangeChain = 'Hydration';
    vi.mocked(createExchangeInstance).mockReturnValue({
      chain: exchangeChain,
    } as ExchangeChain);

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

    const result = getSupportedAssetsFrom(fromChain, exchange);

    expect(result).toEqual([{ symbol: 'WUD', assetId: '1000085' }]);
  });

  it('should return all assets from chain when exchange is auto select', () => {
    const fromChain: TSubstrateChain = 'Acala';
    const exchange = undefined;
    const fromAssets: TAssetInfo[] = [{ symbol: 'ACA', assetId: '1000099' }];
    vi.mocked(getAssets).mockReturnValue(fromAssets);

    const result = getSupportedAssetsFrom(fromChain, exchange);
    expect(result).toEqual(fromAssets);
  });

  it('should return exchange assets when from chain is same as exchange chain', () => {
    const fromChain: TSubstrateChain = 'Hydration';
    const exchange: TExchangeChain = 'HydrationDex';

    vi.mocked(createExchangeInstance).mockReturnValue({
      chain: fromChain,
    } as ExchangeChain);

    const exchangeAssets: TAssetInfo[] = [{ symbol: 'HDX', assetId: '123' }];
    vi.mocked(getExchangeAssets).mockReturnValue(exchangeAssets);

    const result = getSupportedAssetsFrom(fromChain, exchange);

    expect(result).toEqual(exchangeAssets);
    expect(getAssets).not.toHaveBeenCalled();
  });

  it('should return exchange assets when from is undefined', () => {
    const exchange: TExchangeChain = 'HydrationDex';

    vi.mocked(createExchangeInstance).mockReturnValue({
      chain: 'Hydration',
    } as ExchangeChain);

    const exchangeAssets: TAssetInfo[] = [{ symbol: 'HDX', assetId: '123' }];
    vi.mocked(getExchangeAssets).mockReturnValue(exchangeAssets);

    const result = getSupportedAssetsFrom(undefined, exchange);

    expect(result).toEqual(exchangeAssets);
  });

  it('should match assets with different symbol cases after normalization', () => {
    const fromChain: TSubstrateChain = 'Acala';
    const exchange: TExchangeChain = 'HydrationDex';

    vi.mocked(createExchangeInstance).mockReturnValue({
      chain: 'Hydration',
    } as ExchangeChain);

    const exchangeAssets: TAssetInfo[] = [{ symbol: 'usdt', assetId: '123' }];
    vi.mocked(getExchangeAssets).mockReturnValue(exchangeAssets);

    const fromAssets: TAssetInfo[] = [{ symbol: 'USDT', assetId: '456' }];
    vi.mocked(getAssets).mockReturnValue(fromAssets);

    const result = getSupportedAssetsFrom(fromChain, exchange);

    expect(result).toEqual(fromAssets);
    expect(normalizeSymbol).toHaveBeenCalledWith('usdt');
    expect(normalizeSymbol).toHaveBeenCalledWith('USDT');
  });

  it('should return empty array when no assets match between chain and exchange', () => {
    const fromChain: TSubstrateChain = 'Acala';
    const exchange: TExchangeChain = 'HydrationDex';

    vi.mocked(createExchangeInstance).mockReturnValue({
      chain: 'Hydration',
    } as ExchangeChain);

    const exchangeAssets: TAssetInfo[] = [{ symbol: 'HDX', assetId: '123' }];
    vi.mocked(getExchangeAssets).mockReturnValue(exchangeAssets);

    const fromAssets: TAssetInfo[] = [{ symbol: 'ACA', assetId: '456' }];
    vi.mocked(getAssets).mockReturnValue(fromAssets);

    const result = getSupportedAssetsFrom(fromChain, exchange);

    expect(result).toEqual([]);
  });

  it('should return empty array when exchange is Auto select and from is undefined', () => {
    const exchange = undefined;
    const result = getSupportedAssetsFrom(undefined, exchange);

    expect(result).toEqual([]);
    expect(getAssets).not.toHaveBeenCalled();
  });
});
