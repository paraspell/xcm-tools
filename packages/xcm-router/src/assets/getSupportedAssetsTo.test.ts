import type { TAssetInfo, TChain } from '@paraspell/sdk';
import { getAssets } from '@paraspell/sdk';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { EXCHANGE_CHAINS } from '../consts';
import type ExchangeChain from '../exchanges/ExchangeChain';
import { createExchangeInstance } from '../exchanges/ExchangeChainFactory';
import type { TExchangeChain } from '../types';
import { getExchangeAssets } from './getExchangeConfig';
import { getSupportedAssetsTo } from './getSupportedAssetsTo';

vi.mock('@paraspell/sdk', () => ({
  getAssets: vi.fn(),
  normalizeSymbol: (symbol: string) => symbol.toLowerCase(),
}));

vi.mock('../exchanges/ExchangeChainFactory', () => ({
  createExchangeInstance: vi.fn(),
}));

vi.mock('./getExchangeConfig', () => ({
  getExchangeAssets: vi.fn(),
}));

vi.mock('../consts', () => ({
  EXCHANGE_CHAINS: ['AcalaDex', 'BifrostPolkadotDex'],
}));

describe('getSupportedAssetsTo', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('should return exchange assets directly when "to" is undefined and exchange is not "Auto select"', () => {
    const mockExchange: TExchangeChain = 'AcalaDex';
    const mockChain = { chain: 'Acala' } as ExchangeChain;
    vi.mocked(createExchangeInstance).mockReturnValue(mockChain);
    const exchangeAssets = [{ symbol: 'ABC' }, { symbol: 'DEF' }] as TAssetInfo[];
    vi.mocked(getExchangeAssets).mockReturnValue(exchangeAssets);

    const result = getSupportedAssetsTo(mockExchange, undefined);

    expect(getExchangeAssets).toHaveBeenCalledWith(mockExchange);
    expect(result).toEqual(exchangeAssets);
  });

  it('should filter exchange assets based on "to" assets when exchange is not "Auto select"', () => {
    const mockExchange: TExchangeChain = 'AcalaDex';
    const mockChain = { chain: 'Acala' } as ExchangeChain;
    vi.mocked(createExchangeInstance).mockReturnValue(mockChain);
    const exchangeAssets = [{ symbol: 'ABC' }, { symbol: 'DEF' }] as TAssetInfo[];
    vi.mocked(getExchangeAssets).mockReturnValue(exchangeAssets);
    const toChain: TChain = 'Astar';
    vi.mocked(getAssets).mockReturnValue([{ symbol: 'abc' }] as TAssetInfo[]);

    const result = getSupportedAssetsTo(mockExchange, toChain);

    expect(getAssets).toHaveBeenCalledWith(toChain);
    expect(result).toEqual([{ symbol: 'ABC' }]);
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

    const assets1 = [{ symbol: 'ABC' }] as TAssetInfo[];
    const assets2 = [{ symbol: 'DEF' }] as TAssetInfo[];
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

    const assets1 = [{ symbol: 'ABC' }] as TAssetInfo[];
    const assets2 = [{ symbol: 'DEF' }] as TAssetInfo[];
    vi.mocked(getExchangeAssets).mockImplementation((exchange) => {
      if (exchange === 'AcalaDex') return assets1;
      if (exchange === 'BifrostPolkadotDex') return assets2;
      return [];
    });

    const toChain = 'Astar';
    vi.mocked(getAssets).mockReturnValue([{ symbol: 'DEF' }] as TAssetInfo[]);

    const result = getSupportedAssetsTo(exchange, toChain);

    expect(getAssets).toHaveBeenCalledWith(toChain);
    expect(result).toEqual([{ symbol: 'DEF' }]);
  });
});
