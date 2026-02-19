import type { TAssetInfo, TSubstrateChain } from '@paraspell/sdk';
import { getAssets, isAssetEqual } from '@paraspell/sdk';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createExchangeInstance } from '../exchanges/ExchangeChainFactory';
import type { TExchangeChain } from '../types';
import { getSupportedAssetsFrom } from './getSupportedAssetsFrom';
import { getSupportedFeeAssets } from './getSupportedFeeAssets';

vi.mock('@paraspell/sdk');
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
    const exchange: TExchangeChain = 'HydrationDex';

    vi.mocked(getSupportedAssetsFrom).mockReturnValue([feeAsset, nonFeeAsset, anotherFeeAsset]);
    vi.mocked(getAssets).mockReturnValue([feeAsset, nonFeeAsset, anotherFeeAsset]);

    const result = getSupportedFeeAssets(from, exchange);

    expect(result).toEqual([feeAsset, anotherFeeAsset]);
    expect(getSupportedAssetsFrom).toHaveBeenCalledWith(from, exchange);
    expect(getAssets).toHaveBeenCalledWith(from);
  });

  it('should return empty array when no supported assets are fee assets', () => {
    const from: TSubstrateChain = 'Acala';
    const exchange: TExchangeChain = 'HydrationDex';

    vi.mocked(getSupportedAssetsFrom).mockReturnValue([nonFeeAsset]);
    vi.mocked(getAssets).mockReturnValue([nonFeeAsset]);

    const result = getSupportedFeeAssets(from, exchange);

    expect(result).toEqual([]);
  });

  it('should gather assets from exchange chains when from is undefined', () => {
    const exchange: TExchangeChain = 'HydrationDex';

    vi.mocked(createExchangeInstance).mockReturnValue({ chain: 'Hydration' } as never);
    vi.mocked(getSupportedAssetsFrom).mockReturnValue([feeAsset, nonFeeAsset]);
    vi.mocked(getAssets).mockReturnValue([feeAsset, nonFeeAsset]);

    const result = getSupportedFeeAssets(undefined, exchange);

    expect(result).toEqual([feeAsset]);
    expect(createExchangeInstance).toHaveBeenCalledWith('HydrationDex');
    expect(getAssets).toHaveBeenCalledWith('Hydration');
  });

  it('should gather assets from all EXCHANGE_CHAINS when both from and exchange are undefined', () => {
    vi.mocked(createExchangeInstance).mockImplementation(
      (ex) =>
        ({
          chain:
            ex === 'HydrationDex' ? 'Hydration' : ex === 'AcalaDex' ? 'Acala' : 'AssetHubPolkadot',
        }) as never,
    );
    vi.mocked(getSupportedAssetsFrom).mockReturnValue([feeAsset]);
    vi.mocked(getAssets).mockReturnValue([feeAsset]);

    const result = getSupportedFeeAssets(undefined, undefined);

    expect(result).toEqual([feeAsset]);
    expect(getSupportedAssetsFrom).toHaveBeenCalledWith(undefined, undefined);
  });

  it('should gather assets from multiple exchanges when exchange is array and from undefined', () => {
    const exchanges: [TExchangeChain, ...TExchangeChain[]] = ['HydrationDex', 'AcalaDex'];

    vi.mocked(createExchangeInstance).mockImplementation(
      (ex) => ({ chain: ex === 'HydrationDex' ? 'Hydration' : 'Acala' }) as never,
    );
    vi.mocked(getSupportedAssetsFrom).mockReturnValue([feeAsset, nonFeeAsset]);
    vi.mocked(getAssets).mockReturnValue([feeAsset, nonFeeAsset]);

    const result = getSupportedFeeAssets(undefined, exchanges);

    expect(result).toEqual([feeAsset]);
    expect(createExchangeInstance).toHaveBeenCalledWith('HydrationDex');
    expect(createExchangeInstance).toHaveBeenCalledWith('AcalaDex');
  });

  it('should filter by location match against chain fee assets', () => {
    const from: TSubstrateChain = 'AssetHubPolkadot';
    const exchange: TExchangeChain = 'HydrationDex';

    // Supported assets from router perspective
    vi.mocked(getSupportedAssetsFrom).mockReturnValue([feeAsset, nonFeeAsset]);
    // Chain assets with fee flag - only feeAsset is marked
    vi.mocked(getAssets).mockReturnValue([feeAsset, nonFeeAsset]);

    const result = getSupportedFeeAssets(from, exchange);

    expect(result).toEqual([feeAsset]);
  });

  it('should return empty array when exchange is auto select and from has no fee assets', () => {
    const from: TSubstrateChain = 'Acala';

    vi.mocked(getSupportedAssetsFrom).mockReturnValue([nonFeeAsset]);
    vi.mocked(getAssets).mockReturnValue([nonFeeAsset]);

    const result = getSupportedFeeAssets(from, undefined);

    expect(result).toEqual([]);
  });
});
