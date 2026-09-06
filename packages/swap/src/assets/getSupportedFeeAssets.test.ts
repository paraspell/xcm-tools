import type { TAssetInfo, TCustomCtx, TExchangeChain, TSubstrateChain } from '@paraspell/sdk-core';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { getSupportedAssetsFromImpl } from './getSupportedAssetsFrom';
import { getSupportedFeeAssets, getSupportedFeeAssetsImpl } from './getSupportedFeeAssets';

vi.mock('./getSupportedAssetsFrom');

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
  });

  it('should return only supported assets that are fee assets', () => {
    const from: TSubstrateChain = 'AssetHubPolkadot';
    const exchange: TExchangeChain = 'Hydration';

    vi.mocked(getSupportedAssetsFromImpl).mockReturnValue([feeAsset, nonFeeAsset, anotherFeeAsset]);

    const result = getSupportedFeeAssets(from, exchange);

    expect(result).toEqual([feeAsset, anotherFeeAsset]);
    expect(getSupportedAssetsFromImpl).toHaveBeenCalledWith(from, exchange, undefined);
  });

  it('should return empty array when no supported assets are fee assets', () => {
    const from: TSubstrateChain = 'Acala';
    const exchange: TExchangeChain = 'Hydration';

    vi.mocked(getSupportedAssetsFromImpl).mockReturnValue([nonFeeAsset]);

    const result = getSupportedFeeAssets(from, exchange);

    expect(result).toEqual([]);
  });

  it('should return fee assets when from is undefined', () => {
    const exchange: TExchangeChain = 'Hydration';

    vi.mocked(getSupportedAssetsFromImpl).mockReturnValue([feeAsset, nonFeeAsset]);

    const result = getSupportedFeeAssets(undefined, exchange);

    expect(result).toEqual([feeAsset]);
    expect(getSupportedAssetsFromImpl).toHaveBeenCalledWith(undefined, exchange, undefined);
  });

  it('should return fee assets when both from and exchange are undefined', () => {
    vi.mocked(getSupportedAssetsFromImpl).mockReturnValue([feeAsset]);

    const result = getSupportedFeeAssets(undefined, undefined);

    expect(result).toEqual([feeAsset]);
    expect(getSupportedAssetsFromImpl).toHaveBeenCalledWith(undefined, undefined, undefined);
  });

  it('should return empty array when exchange is auto select and from has no fee assets', () => {
    const from: TSubstrateChain = 'Acala';

    vi.mocked(getSupportedAssetsFromImpl).mockReturnValue([nonFeeAsset]);

    const result = getSupportedFeeAssets(from, undefined);

    expect(result).toEqual([]);
  });

  it('should pass ctx to getSupportedAssetsFromImpl', () => {
    const from: TSubstrateChain = 'AssetHubPolkadot';
    const exchange: TExchangeChain = 'Hydration';
    const ctx: TCustomCtx = {};

    vi.mocked(getSupportedAssetsFromImpl).mockReturnValue([feeAsset]);

    const result = getSupportedFeeAssetsImpl(from, exchange, ctx);

    expect(result).toEqual([feeAsset]);
    expect(getSupportedAssetsFromImpl).toHaveBeenCalledWith(from, exchange, ctx);
  });

  it('should not borrow fee eligibility across selected exchanges', () => {
    const exchanges: TExchangeChain[] = ['Hydration', 'Acala'];

    const hydrationDot: TAssetInfo = {
      symbol: 'DOT',
      decimals: 10,
      assetId: '5',
      location: { parents: 1, interior: 'Here' },
      isFeeAsset: true,
    };

    const acalaDot: TAssetInfo = {
      symbol: 'DOT',
      decimals: 10,
      assetId: '{"Token":"DOT"}',
      location: { parents: 1, interior: 'Here' },
    };

    vi.mocked(getSupportedAssetsFromImpl).mockReturnValue([hydrationDot, acalaDot]);

    const result = getSupportedFeeAssets(undefined, exchanges);

    expect(result).toEqual([hydrationDot]);
    expect(getSupportedAssetsFromImpl).toHaveBeenCalledWith(undefined, exchanges, undefined);
  });
});
