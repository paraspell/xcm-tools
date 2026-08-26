import type { TAssetInfo } from '@paraspell/sdk-core';
import { findAssetInfoOnDestImpl, getSupportedAssetsImpl } from '@paraspell/sdk-core';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { getExchangeAssetByOriginAsset } from './getExchangeAssetByOriginAsset';
import { getExchangeAssets } from './getExchangeConfig';

vi.mock('@paraspell/sdk-core', async (importOriginal) => ({
  ...(await importOriginal()),
  findAssetInfoOnDestImpl: vi.fn(),
  getSupportedAssetsImpl: vi.fn(),
}));

vi.mock('./getExchangeConfig');

describe('getExchangeAssetByOriginAsset', () => {
  const originAsset: TAssetInfo = {
    symbol: 'ABC',
    decimals: 12,
    location: { parents: 1, interior: { Here: null } },
  };

  const routerAssetA: TAssetInfo = {
    symbol: 'AAA',
    decimals: 12,
    location: { parents: 0, interior: { Here: null } },
  };

  const routerAssetB: TAssetInfo = {
    symbol: 'BBB',
    decimals: 12,
    location: { parents: 1, interior: { Here: null } },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns undefined when the asset is not transferable to the exchange', () => {
    vi.mocked(getSupportedAssetsImpl).mockReturnValue([]);

    const result = getExchangeAssetByOriginAsset('Astar', 'Acala', originAsset);

    expect(result).toBeUndefined();
    expect(findAssetInfoOnDestImpl).not.toHaveBeenCalled();
  });

  it('returns undefined when the asset cannot be resolved on the exchange', () => {
    vi.mocked(getSupportedAssetsImpl).mockReturnValue([originAsset]);
    vi.mocked(findAssetInfoOnDestImpl).mockReturnValue(null);

    const result = getExchangeAssetByOriginAsset('Astar', 'Acala', originAsset);

    expect(result).toBeUndefined();
    expect(getExchangeAssets).not.toHaveBeenCalled();
  });

  it('returns undefined when no exchange assets match the resolved asset', () => {
    vi.mocked(getSupportedAssetsImpl).mockReturnValue([originAsset]);
    vi.mocked(findAssetInfoOnDestImpl).mockReturnValue(routerAssetB);
    vi.mocked(getExchangeAssets).mockReturnValue([routerAssetA]);

    const result = getExchangeAssetByOriginAsset('Astar', 'Acala', originAsset);

    expect(result).toBeUndefined();
  });

  it('returns the exchange asset matching the resolved destination asset', () => {
    vi.mocked(getSupportedAssetsImpl).mockReturnValue([originAsset]);
    vi.mocked(findAssetInfoOnDestImpl).mockReturnValue(routerAssetB);
    vi.mocked(getExchangeAssets).mockReturnValue([routerAssetA, routerAssetB]);

    const result = getExchangeAssetByOriginAsset('Astar', 'Acala', originAsset);

    expect(result).toBe(routerAssetB);
    expect(getSupportedAssetsImpl).toHaveBeenCalledWith('Astar', 'Acala', undefined);
    expect(findAssetInfoOnDestImpl).toHaveBeenCalledWith(
      'Astar',
      'Acala',
      { location: originAsset.location },
      originAsset,
      undefined,
    );
  });

  it('forwards the custom context to the asset lookups', () => {
    const ctx = { customAssets: {} };
    vi.mocked(getSupportedAssetsImpl).mockReturnValue([originAsset]);
    vi.mocked(findAssetInfoOnDestImpl).mockReturnValue(routerAssetB);
    vi.mocked(getExchangeAssets).mockReturnValue([routerAssetB]);

    getExchangeAssetByOriginAsset('Astar', 'Acala', originAsset, ctx);

    expect(getSupportedAssetsImpl).toHaveBeenCalledWith('Astar', 'Acala', ctx);
    expect(findAssetInfoOnDestImpl).toHaveBeenCalledWith(
      'Astar',
      'Acala',
      { location: originAsset.location },
      originAsset,
      ctx,
    );
  });

  it('resolves a bridged asset to its exchange representation', () => {
    const ksmOnAssetHubKusama: TAssetInfo = {
      symbol: 'KSM',
      decimals: 12,
      location: { parents: 1, interior: { Here: null } },
    };
    const ksmOnAssetHubPolkadot: TAssetInfo = {
      symbol: 'KSM',
      decimals: 12,
      location: { parents: 2, interior: { X1: [{ GlobalConsensus: { kusama: null } }] } },
    };
    const dotOnAssetHubPolkadot: TAssetInfo = {
      symbol: 'DOT',
      decimals: 10,
      location: { parents: 1, interior: { Here: null } },
    };

    vi.mocked(getSupportedAssetsImpl).mockReturnValue([ksmOnAssetHubKusama]);
    vi.mocked(findAssetInfoOnDestImpl).mockReturnValue(ksmOnAssetHubPolkadot);
    vi.mocked(getExchangeAssets).mockReturnValue([dotOnAssetHubPolkadot, ksmOnAssetHubPolkadot]);

    const result = getExchangeAssetByOriginAsset(
      'AssetHubKusama',
      'AssetHubPolkadot',
      ksmOnAssetHubKusama,
    );

    expect(result).toBe(ksmOnAssetHubPolkadot);
  });
});
