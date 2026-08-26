import type { TAssetInfo, TChain, TExchangeChain } from '@paraspell/sdk-core';
import { EXCHANGE_CHAINS, getSupportedAssetsImpl, isAssetEqual } from '@paraspell/sdk-core';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type ExchangeChain from '../exchanges/ExchangeChain';
import { createExchangeInstance } from '../exchanges/ExchangeChainFactory';
import { getExchangeAssets } from './getExchangeConfig';
import { getSupportedAssetsTo } from './getSupportedAssetsTo';

vi.mock('@paraspell/sdk-core', async (importActual) => ({
  ...(await importActual()),
  getSupportedAssetsImpl: vi.fn(),
  isAssetEqual: vi.fn(),
}));

vi.mock('../exchanges/ExchangeChainFactory');
vi.mock('./getExchangeConfig');

describe('getSupportedAssetsTo', () => {
  const abcAsset: TAssetInfo = {
    symbol: 'ABC',
    decimals: 12,
    location: {
      parents: 0,
      interior: 'Here',
    },
  };

  const defAsset: TAssetInfo = {
    symbol: 'DEF',
    decimals: 12,
    location: {
      parents: 1,
      interior: 'Here',
    },
  };

  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(isAssetEqual).mockImplementation(
      (a, b) => JSON.stringify(a.location) === JSON.stringify(b.location),
    );
  });

  it('should return exchange assets directly when "to" is undefined and exchange is not "Auto select"', () => {
    const mockExchange: TExchangeChain = 'Acala';
    const exchangeAssets = [abcAsset, defAsset];
    vi.mocked(getExchangeAssets).mockReturnValue(exchangeAssets);

    const result = getSupportedAssetsTo(mockExchange, undefined);

    expect(getExchangeAssets).toHaveBeenCalledWith(mockExchange);
    expect(result).toEqual(exchangeAssets);
  });

  it('should filter exchange assets based on transferable assets when exchange is not "Auto select"', () => {
    const mockExchange: TExchangeChain = 'Acala';
    const mockChain = { chain: 'Acala' } as ExchangeChain;
    vi.mocked(createExchangeInstance).mockReturnValue(mockChain);
    const exchangeAssets = [abcAsset, defAsset];
    vi.mocked(getExchangeAssets).mockReturnValue(exchangeAssets);
    const toChain: TChain = 'Astar';
    vi.mocked(getSupportedAssetsImpl).mockReturnValue([abcAsset]);

    const result = getSupportedAssetsTo(mockExchange, toChain);

    expect(getSupportedAssetsImpl).toHaveBeenCalledWith('Acala', toChain, undefined);
    expect(result).toEqual([abcAsset]);
  });

  it('should return exchange assets directly when "to" equals the exchange chain', () => {
    const mockExchange: TExchangeChain = 'Acala';
    const mockChain = { chain: 'Acala' } as ExchangeChain;
    vi.mocked(createExchangeInstance).mockReturnValue(mockChain);
    const exchangeAssets = [abcAsset, defAsset];
    vi.mocked(getExchangeAssets).mockReturnValue(exchangeAssets);

    const result = getSupportedAssetsTo(mockExchange, 'Acala');

    expect(result).toEqual(exchangeAssets);
    expect(getSupportedAssetsImpl).not.toHaveBeenCalled();
  });

  it('should return flattened assets from all exchange chains when exchange is "Auto select" and "to" is undefined', () => {
    const exchange = undefined;

    const assets1 = [abcAsset];
    const assets2 = [defAsset];
    vi.mocked(getExchangeAssets).mockImplementation((exchange) => {
      if (exchange === 'Acala') return assets1;
      if (exchange === 'BifrostPolkadot') return assets2;
      return [];
    });

    const result = getSupportedAssetsTo(exchange, undefined);

    expect(getExchangeAssets).toHaveBeenCalledTimes(EXCHANGE_CHAINS.length);
    expect(result).toEqual([...assets1, ...assets2]);
  });

  it('should filter flattened assets based on transferable assets when exchange is "Auto select"', () => {
    const exchange = undefined;
    const chain1 = 'Acala';
    const chain2 = 'BifrostPolkadot';

    vi.mocked(createExchangeInstance).mockImplementation((exchange: TExchangeChain) => {
      if (exchange === 'Acala') return { chain: chain1 } as ExchangeChain;
      if (exchange === 'BifrostPolkadot') return { chain: chain2 } as ExchangeChain;
      return { chain: exchange } as ExchangeChain;
    });

    const assets1 = [abcAsset];
    const assets2 = [defAsset];
    vi.mocked(getExchangeAssets).mockImplementation((exchange) => {
      if (exchange === 'Acala') return assets1;
      if (exchange === 'BifrostPolkadot') return assets2;
      return [];
    });

    const toChain = 'Astar';
    vi.mocked(getSupportedAssetsImpl).mockReturnValue([defAsset]);

    const result = getSupportedAssetsTo(exchange, toChain);

    expect(getSupportedAssetsImpl).toHaveBeenCalledWith(chain1, toChain, undefined);
    expect(getSupportedAssetsImpl).toHaveBeenCalledWith(chain2, toChain, undefined);
    expect(result).toEqual([defAsset]);
  });

  it('should exclude exchanges with no transferable assets to the destination', () => {
    const mockExchange: TExchangeChain = 'AssetHubKusama';
    const mockChain = { chain: 'AssetHubKusama' } as ExchangeChain;
    vi.mocked(createExchangeInstance).mockReturnValue(mockChain);
    vi.mocked(getExchangeAssets).mockReturnValue([abcAsset, defAsset]);
    vi.mocked(getSupportedAssetsImpl).mockReturnValue([]);

    const result = getSupportedAssetsTo(mockExchange, 'Astar');

    expect(result).toEqual([]);
  });
});
