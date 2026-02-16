import type { TAssetInfo, TChain } from '@paraspell/sdk';
import { getAssets, isExternalChain, isSystemAsset } from '@paraspell/sdk';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { EXCHANGE_CHAINS } from '../consts';
import type ExchangeChain from '../exchanges/ExchangeChain';
import { createExchangeInstance } from '../exchanges/ExchangeChainFactory';
import type { TExchangeChain } from '../types';
import { getExchangeAssets } from './getExchangeConfig';
import { getSupportedAssetsTo } from './getSupportedAssetsTo';

vi.mock('@paraspell/sdk', async (importActual) => ({
  ...(await importActual()),
  getAssets: vi.fn(),
  isExternalChain: vi.fn(),
  isSystemAsset: vi.fn(),
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
  });

  it('should return exchange assets directly when "to" is undefined and exchange is not "Auto select"', () => {
    const mockExchange: TExchangeChain = 'AcalaDex';
    const mockChain = { chain: 'Acala' } as ExchangeChain;
    vi.mocked(createExchangeInstance).mockReturnValue(mockChain);
    const exchangeAssets = [abcAsset, defAsset];
    vi.mocked(getExchangeAssets).mockReturnValue(exchangeAssets);

    const result = getSupportedAssetsTo(mockExchange, undefined);

    expect(getExchangeAssets).toHaveBeenCalledWith(mockExchange);
    expect(result).toEqual(exchangeAssets);
  });

  it('should filter exchange assets based on "to" assets when exchange is not "Auto select"', () => {
    const mockExchange: TExchangeChain = 'AcalaDex';
    const mockChain = { chain: 'Acala' } as ExchangeChain;
    vi.mocked(createExchangeInstance).mockReturnValue(mockChain);
    const exchangeAssets = [abcAsset, defAsset];
    vi.mocked(getExchangeAssets).mockReturnValue(exchangeAssets);
    const toChain: TChain = 'Astar';
    vi.mocked(getAssets).mockReturnValue([abcAsset]);

    const result = getSupportedAssetsTo(mockExchange, toChain);

    expect(getAssets).toHaveBeenCalledWith(toChain);
    expect(result).toEqual([abcAsset]);
  });

  it('should append system assets when destination chain is external', () => {
    const mockExchange: TExchangeChain = 'AcalaDex';
    const mockChain = { chain: 'Acala' } as ExchangeChain;
    vi.mocked(createExchangeInstance).mockReturnValue(mockChain);
    const exchangeAssets = [abcAsset, defAsset];
    vi.mocked(getExchangeAssets).mockReturnValue(exchangeAssets);
    const toChain: TChain = 'Astar';
    vi.mocked(getAssets).mockReturnValue([abcAsset]);
    vi.mocked(isExternalChain).mockReturnValue(true);
    vi.mocked(isSystemAsset).mockImplementation((asset) => asset.symbol === 'DEF');

    const result = getSupportedAssetsTo(mockExchange, toChain);

    expect(getAssets).toHaveBeenCalledWith(toChain);
    expect(isExternalChain).toHaveBeenCalledWith(toChain);
    expect(isSystemAsset).toHaveBeenCalledTimes(exchangeAssets.length);
    expect(result).toEqual([abcAsset, defAsset]);
  });

  it('should return flattened assets from all exchange chains when exchange is "Auto select" and "to" is undefined', () => {
    const exchange = undefined;
    const chain1 = 'Acala';
    const chain2 = 'BifrostPolkadot';

    vi.mocked(createExchangeInstance).mockImplementation((exchange: TExchangeChain) => {
      if (exchange === 'AcalaDex') return { chain: chain1 } as ExchangeChain;
      if (exchange === 'BifrostPolkadotDex') return { chain: chain2 } as ExchangeChain;
      return {} as ExchangeChain;
    });

    const assets1 = [abcAsset];
    const assets2 = [defAsset];
    vi.mocked(getExchangeAssets).mockImplementation((exchange) => {
      if (exchange === 'AcalaDex') return assets1;
      if (exchange === 'BifrostPolkadotDex') return assets2;
      return [];
    });

    const result = getSupportedAssetsTo(exchange, undefined);

    expect(getExchangeAssets).toHaveBeenCalledTimes(EXCHANGE_CHAINS.length);
    expect(result).toEqual([...assets1, ...assets2]);
  });

  it('should filter flattened assets based on "to" assets when exchange is "Auto select"', () => {
    const exchange = undefined;
    const chain1 = 'Acala';
    const chain2 = 'BifrostPolkadot';

    vi.mocked(createExchangeInstance).mockImplementation((exchange: TExchangeChain) => {
      if (exchange === 'AcalaDex') return { chain: chain1 } as ExchangeChain;
      if (exchange === 'BifrostPolkadotDex') return { chain: chain2 } as ExchangeChain;
      return {} as ExchangeChain;
    });

    const assets1 = [abcAsset];
    const assets2 = [defAsset];
    vi.mocked(getExchangeAssets).mockImplementation((exchange) => {
      if (exchange === 'AcalaDex') return assets1;
      if (exchange === 'BifrostPolkadotDex') return assets2;
      return [];
    });

    const toChain = 'Astar';
    vi.mocked(getAssets).mockReturnValue([defAsset]);

    const result = getSupportedAssetsTo(exchange, toChain);

    expect(getAssets).toHaveBeenCalledWith(toChain);
    expect(result).toEqual([defAsset]);
  });

  it('should append system assets when exchange is "Auto select" and destination chain is external', () => {
    const exchange = undefined;

    const assets1 = [abcAsset];
    const assets2 = [defAsset];
    vi.mocked(getExchangeAssets).mockImplementation((exchange) => {
      if (exchange === 'AcalaDex') return assets1;
      if (exchange === 'BifrostPolkadotDex') return assets2;
      return [];
    });

    const toChain: TChain = 'Astar';
    vi.mocked(getAssets).mockReturnValue([abcAsset]);
    vi.mocked(isExternalChain).mockReturnValue(true);
    vi.mocked(isSystemAsset).mockImplementation((asset) => asset.symbol === 'DEF');

    const result = getSupportedAssetsTo(exchange, toChain);

    expect(getAssets).toHaveBeenCalledWith(toChain);
    expect(isExternalChain).toHaveBeenCalledWith(toChain);
    expect(isSystemAsset).toHaveBeenCalledTimes(assets1.length + assets2.length);
    expect(result).toEqual([abcAsset, defAsset]);
  });
});
