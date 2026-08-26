import type { TAssetInfo, TExchangeChain, TSubstrateChain } from '@paraspell/sdk-core';
import {
  findAssetInfoOnDestImpl,
  getAssetsImpl,
  getSupportedAssetsImpl,
  isAssetEqual,
} from '@paraspell/sdk-core';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type ExchangeChain from '../exchanges/ExchangeChain';
import { createExchangeInstance } from '../exchanges/ExchangeChainFactory';
import { getExchangeAssets } from './getExchangeConfig';
import { getSupportedAssetsFrom } from './getSupportedAssetsFrom';

vi.mock('@paraspell/sdk-core', async (importActual) => ({
  ...(await importActual()),
  findAssetInfoOnDestImpl: vi.fn(),
  getAssetsImpl: vi.fn(),
  getSupportedAssetsImpl: vi.fn(),
  isAssetEqual: vi.fn(),
}));

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
    vi.mocked(findAssetInfoOnDestImpl).mockImplementation((_origin, _dest, _currency, asset) =>
      asset ? asset : null,
    );
  });

  it('should return assets from exchange that match chain assets', () => {
    const fromChain: TSubstrateChain = 'Acala';
    const exchange: TExchangeChain = 'Hydration';

    const exchangeChain = 'Hydration';
    vi.mocked(createExchangeInstance).mockReturnValue({
      chain: exchangeChain,
    } as ExchangeChain);

    vi.mocked(getExchangeAssets).mockReturnValue([hdxAsset, wudAsset]);

    vi.mocked(getAssetsImpl).mockReturnValue([wudAsset, acaAsset]);
    vi.mocked(getSupportedAssetsImpl).mockReturnValue([wudAsset, acaAsset]);

    const result = getSupportedAssetsFrom(fromChain, exchange);

    expect(result).toEqual([wudAsset]);
  });

  it('should return all assets from chain when exchange is auto select', () => {
    const fromChain: TSubstrateChain = 'Acala';
    const exchange = undefined;
    const fromAssets = [acaAsset];
    vi.mocked(getAssetsImpl).mockReturnValue(fromAssets);

    const result = getSupportedAssetsFrom(fromChain, exchange);
    expect(result).toEqual(fromAssets);
  });

  it('should return exchange assets when from chain is same as exchange chain', () => {
    const fromChain: TSubstrateChain = 'Hydration';
    const exchange: TExchangeChain = 'Hydration';

    vi.mocked(createExchangeInstance).mockReturnValue({
      chain: fromChain,
    } as ExchangeChain);

    const exchangeAssets = [hdxAsset];
    vi.mocked(getExchangeAssets).mockReturnValue(exchangeAssets);

    const result = getSupportedAssetsFrom(fromChain, exchange);

    expect(result).toEqual(exchangeAssets);
    expect(getAssetsImpl).not.toHaveBeenCalled();
  });

  it('should return exchange assets when from is undefined', () => {
    const exchange: TExchangeChain = 'Hydration';

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
    const exchange: TExchangeChain = 'Hydration';

    vi.mocked(createExchangeInstance).mockReturnValue({
      chain: 'Hydration',
    } as ExchangeChain);

    vi.mocked(getExchangeAssets).mockReturnValue([{ ...usdtAsset, symbol: 'usdt' }]);

    const fromAssets = [usdtAsset];
    vi.mocked(getAssetsImpl).mockReturnValue(fromAssets);
    vi.mocked(getSupportedAssetsImpl).mockReturnValue(fromAssets);

    const result = getSupportedAssetsFrom(fromChain, exchange);

    expect(result).toEqual(fromAssets);
  });

  it('should return empty array when no assets match between chain and exchange', () => {
    const fromChain: TSubstrateChain = 'Acala';
    const exchange: TExchangeChain = 'Hydration';

    vi.mocked(createExchangeInstance).mockReturnValue({
      chain: 'Hydration',
    } as ExchangeChain);

    vi.mocked(getExchangeAssets).mockReturnValue([hdxAsset]);

    vi.mocked(getAssetsImpl).mockReturnValue([acaAsset]);
    vi.mocked(getSupportedAssetsImpl).mockReturnValue([acaAsset]);

    const result = getSupportedAssetsFrom(fromChain, exchange);

    expect(result).toEqual([]);
  });

  it('should return empty array when exchange is Auto select and from is undefined', () => {
    const exchange = undefined;
    const result = getSupportedAssetsFrom(undefined, exchange);

    expect(result).toEqual([]);
    expect(getAssetsImpl).not.toHaveBeenCalled();
  });

  it('should return empty array when no assets are transferable to the exchange', () => {
    const fromChain: TSubstrateChain = 'Astar';
    const exchange: TExchangeChain = 'AssetHubKusama';

    vi.mocked(createExchangeInstance).mockReturnValue({
      chain: 'AssetHubKusama',
    } as ExchangeChain);

    vi.mocked(getExchangeAssets).mockReturnValue([wudAsset]);
    vi.mocked(getAssetsImpl).mockReturnValue([wudAsset]);
    vi.mocked(getSupportedAssetsImpl).mockReturnValue([]);

    const result = getSupportedAssetsFrom(fromChain, exchange);

    expect(result).toEqual([]);
    expect(findAssetInfoOnDestImpl).not.toHaveBeenCalled();
  });

  it('should include a bridged asset resolved to a different exchange location', () => {
    const dotOnAssetHubKusama: TAssetInfo = {
      symbol: 'DOT',
      decimals: 10,
      location: { parents: 2, interior: { X1: [{ GlobalConsensus: { polkadot: null } }] } },
    };
    const dotOnAssetHubPolkadot: TAssetInfo = {
      symbol: 'DOT',
      decimals: 10,
      location: { parents: 1, interior: { Here: null } },
    };

    vi.mocked(createExchangeInstance).mockReturnValue({
      chain: 'AssetHubPolkadot',
    } as ExchangeChain);

    vi.mocked(getExchangeAssets).mockReturnValue([dotOnAssetHubPolkadot]);
    vi.mocked(getAssetsImpl).mockReturnValue([dotOnAssetHubKusama]);
    vi.mocked(getSupportedAssetsImpl).mockReturnValue([dotOnAssetHubKusama]);
    vi.mocked(findAssetInfoOnDestImpl).mockReturnValue(dotOnAssetHubPolkadot);

    const result = getSupportedAssetsFrom('AssetHubKusama', 'AssetHubPolkadot');

    expect(result).toEqual([dotOnAssetHubKusama]);
  });

  it('should exclude assets that cannot be resolved on the exchange', () => {
    vi.mocked(createExchangeInstance).mockReturnValue({
      chain: 'AssetHubPolkadot',
    } as ExchangeChain);

    vi.mocked(getExchangeAssets).mockReturnValue([wudAsset]);
    vi.mocked(getAssetsImpl).mockReturnValue([wudAsset]);
    vi.mocked(getSupportedAssetsImpl).mockReturnValue([wudAsset]);
    vi.mocked(findAssetInfoOnDestImpl).mockReturnValue(null);

    const result = getSupportedAssetsFrom('AssetHubKusama', 'AssetHubPolkadot');

    expect(result).toEqual([]);
  });
});
