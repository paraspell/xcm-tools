import type { TAssetInfo, TSubstrateChain } from '@paraspell/sdk';
import { getAssets, isAssetEqual } from '@paraspell/sdk';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type ExchangeChain from '../exchanges/ExchangeChain';
import { createExchangeInstance } from '../exchanges/ExchangeChainFactory';
import type { TExchangeChain } from '../types';
import { getExchangeAssets } from './getExchangeConfig';
import { getSupportedAssetsFrom } from './getSupportedAssetsFrom';

vi.mock('@paraspell/sdk');

vi.mock('../exchanges/ExchangeChainFactory');
vi.mock('./getExchangeConfig');

describe('getSupportedAssetsFrom', () => {
  const hdxAsset: TAssetInfo = {
    symbol: 'HDX',
    decimals: 12,
    assetId: '123',
    location: { parents: 0, interior: 'Here' },
  };

  const wudAsset: TAssetInfo = {
    symbol: 'WUD',
    decimals: 12,
    assetId: '1000085',
    location: { parents: 1, interior: 'Here' },
  };

  const acaAsset: TAssetInfo = {
    symbol: 'ACA',
    decimals: 12,
    assetId: '1000099',
    location: { parents: 2, interior: 'Here' },
  };

  const usdtAsset: TAssetInfo = {
    symbol: 'USDT',
    decimals: 12,
    assetId: '1000100',
    location: { parents: 3, interior: 'Here' },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(isAssetEqual).mockImplementation(
      (a, b) => JSON.stringify(a.location) === JSON.stringify(b.location),
    );
  });

  it('should return assets from exchange that match chain assets', () => {
    const fromChain: TSubstrateChain = 'Acala';
    const exchange: TExchangeChain = 'HydrationDex';

    const exchangeChain = 'Hydration';
    vi.mocked(createExchangeInstance).mockReturnValue({
      chain: exchangeChain,
    } as ExchangeChain);

    vi.mocked(getExchangeAssets).mockReturnValue([hdxAsset, wudAsset]);

    vi.mocked(getAssets).mockReturnValue([wudAsset, acaAsset]);

    const result = getSupportedAssetsFrom(fromChain, exchange);

    expect(result).toEqual([wudAsset]);
  });

  it('should return all assets from chain when exchange is auto select', () => {
    const fromChain: TSubstrateChain = 'Acala';
    const exchange = undefined;
    const fromAssets = [acaAsset];
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

    const exchangeAssets = [hdxAsset];
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

    const exchangeAssets = [hdxAsset];
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

    vi.mocked(getExchangeAssets).mockReturnValue([{ ...usdtAsset, symbol: 'usdt' }]);

    const fromAssets = [usdtAsset];
    vi.mocked(getAssets).mockReturnValue(fromAssets);

    const result = getSupportedAssetsFrom(fromChain, exchange);

    expect(result).toEqual(fromAssets);
  });

  it('should return empty array when no assets match between chain and exchange', () => {
    const fromChain: TSubstrateChain = 'Acala';
    const exchange: TExchangeChain = 'HydrationDex';

    vi.mocked(createExchangeInstance).mockReturnValue({
      chain: 'Hydration',
    } as ExchangeChain);

    vi.mocked(getExchangeAssets).mockReturnValue([hdxAsset]);

    vi.mocked(getAssets).mockReturnValue([acaAsset]);

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
