import type { TAssetInfo, TExchangeChain, TSubstrateChain } from '@paraspell/sdk-core';
import { getAssetsImpl, isAssetEqual } from '@paraspell/sdk-core';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createExchangeInstance } from '../exchanges/ExchangeChainFactory';
import { getSupportedAssetsFromImpl } from './getSupportedAssetsFrom';
import { getSupportedFeeAssets } from './getSupportedFeeAssets';

vi.mock('@paraspell/sdk-core', async (importActual) => ({
  ...(await importActual()),
  getAssetsImpl: vi.fn(),
  isAssetEqual: vi.fn(),
}));

vi.mock('./getSupportedAssetsFrom');
vi.mock('../exchanges/ExchangeChainFactory');

describe('getSupportedFeeAssets', () => {
  const feeAsset: TAssetInfo = {
    symbol: 'DOT',
    decimals: 10,
    assetId: '1',
    location: { parents: 0, interior: 'Here' },
    isFeeAsset: true,
  };

  const nonFeeAsset: TAssetInfo = {
    symbol: 'HDX',
    decimals: 12,
    assetId: '2',
    location: { parents: 1, interior: 'Here' },
  };

  const anotherFeeAsset: TAssetInfo = {
    symbol: 'USDT',
    decimals: 6,
    assetId: '3',
    location: { parents: 2, interior: 'Here' },
    isFeeAsset: true,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(isAssetEqual).mockImplementation(
      (a, b) => JSON.stringify(a.location) === JSON.stringify(b.location),
    );
  });

  it('should return only supported assets that are fee assets on the chain', () => {
    const from: TSubstrateChain = 'AssetHubPolkadot';
    const exchange: TExchangeChain = 'Hydration';

    vi.mocked(getSupportedAssetsFromImpl).mockReturnValue([feeAsset, nonFeeAsset, anotherFeeAsset]);
    vi.mocked(getAssetsImpl).mockReturnValue([feeAsset, nonFeeAsset, anotherFeeAsset]);

    const result = getSupportedFeeAssets(from, exchange);

    expect(result).toEqual([feeAsset, anotherFeeAsset]);
    expect(getSupportedAssetsFromImpl).toHaveBeenCalledWith(from, exchange, undefined);
    expect(getAssetsImpl).toHaveBeenCalledWith(from, undefined);
  });

  it('should return empty array when no supported assets are fee assets', () => {
    const from: TSubstrateChain = 'Acala';
    const exchange: TExchangeChain = 'Hydration';

    vi.mocked(getSupportedAssetsFromImpl).mockReturnValue([nonFeeAsset]);
    vi.mocked(getAssetsImpl).mockReturnValue([nonFeeAsset]);

    const result = getSupportedFeeAssets(from, exchange);

    expect(result).toEqual([]);
  });

  it('should gather assets from exchange chains when from is undefined', () => {
    const exchange: TExchangeChain = 'Hydration';

    vi.mocked(createExchangeInstance).mockReturnValue({ chain: 'Hydration' } as never);
    vi.mocked(getSupportedAssetsFromImpl).mockReturnValue([feeAsset, nonFeeAsset]);
    vi.mocked(getAssetsImpl).mockReturnValue([feeAsset, nonFeeAsset]);

    const result = getSupportedFeeAssets(undefined, exchange);

    expect(result).toEqual([feeAsset]);
    expect(createExchangeInstance).toHaveBeenCalledWith('Hydration');
    expect(getAssetsImpl).toHaveBeenCalledWith('Hydration', undefined);
  });

  it('should gather assets from all EXCHANGE_CHAINS when both from and exchange are undefined', () => {
    vi.mocked(createExchangeInstance).mockImplementation(
      (ex) =>
        ({
          chain: ex === 'Hydration' ? 'Hydration' : ex === 'Acala' ? 'Acala' : 'AssetHubPolkadot',
        }) as never,
    );
    vi.mocked(getSupportedAssetsFromImpl).mockReturnValue([feeAsset]);
    vi.mocked(getAssetsImpl).mockReturnValue([feeAsset]);

    const result = getSupportedFeeAssets(undefined, undefined);

    expect(result).toEqual([feeAsset]);
    expect(getSupportedAssetsFromImpl).toHaveBeenCalledWith(undefined, undefined, undefined);
  });

  it('should gather assets from multiple exchanges when exchange is array and from undefined', () => {
    const exchanges: TExchangeChain[] = ['Hydration', 'Acala'];

    vi.mocked(createExchangeInstance).mockImplementation(
      (ex) => ({ chain: ex === 'Hydration' ? 'Hydration' : 'Acala' }) as never,
    );
    vi.mocked(getSupportedAssetsFromImpl).mockReturnValue([feeAsset, nonFeeAsset]);
    vi.mocked(getAssetsImpl).mockReturnValue([feeAsset, nonFeeAsset]);

    const result = getSupportedFeeAssets(undefined, exchanges);

    expect(result).toEqual([feeAsset]);
    expect(createExchangeInstance).toHaveBeenCalledWith('Hydration');
    expect(createExchangeInstance).toHaveBeenCalledWith('Acala');
  });

  it('should filter by location match against chain fee assets', () => {
    const from: TSubstrateChain = 'AssetHubPolkadot';
    const exchange: TExchangeChain = 'Hydration';

    // Supported assets from router perspective
    vi.mocked(getSupportedAssetsFromImpl).mockReturnValue([feeAsset, nonFeeAsset]);
    // Chain assets with fee flag - only feeAsset is marked
    vi.mocked(getAssetsImpl).mockReturnValue([feeAsset, nonFeeAsset]);

    const result = getSupportedFeeAssets(from, exchange);

    expect(result).toEqual([feeAsset]);
  });

  it('should return empty array when exchange is auto select and from has no fee assets', () => {
    const from: TSubstrateChain = 'Acala';

    vi.mocked(getSupportedAssetsFromImpl).mockReturnValue([nonFeeAsset]);
    vi.mocked(getAssetsImpl).mockReturnValue([nonFeeAsset]);

    const result = getSupportedFeeAssets(from, undefined);

    expect(result).toEqual([]);
  });
});
