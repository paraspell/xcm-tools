import type { TAsset, TNodeWithRelayChains } from '@paraspell/sdk';
import { getAssets } from '@paraspell/sdk';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { EXCHANGE_NODES } from '../consts';
import type ExchangeNode from '../dexNodes/DexNode';
import { createDexNodeInstance } from '../dexNodes/DexNodeFactory';
import type { TExchangeNode } from '../types';
import { getExchangeAssets } from './getExchangeConfig';
import { getSupportedAssetsTo } from './getSupportedAssetsTo';

vi.mock('@paraspell/sdk', () => ({
  getAssets: vi.fn(),
  normalizeSymbol: (symbol: string) => symbol.toLowerCase(),
}));

vi.mock('../dexNodes/DexNodeFactory', () => ({
  createDexNodeInstance: vi.fn(),
}));

vi.mock('./getExchangeConfig', () => ({
  getExchangeAssets: vi.fn(),
}));

vi.mock('../consts', () => ({
  EXCHANGE_NODES: ['AcalaDex', 'BifrostPolkadotDex'],
}));

describe('getSupportedAssetsTo', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('should return exchange assets directly when "to" is undefined and exchange is not "Auto select"', () => {
    const dummyExchange: TExchangeNode = 'AcalaDex';
    const dummyNode = { node: 'Acala' } as ExchangeNode;
    vi.mocked(createDexNodeInstance).mockReturnValue(dummyNode);
    const exchangeAssets = [{ symbol: 'ABC' }, { symbol: 'DEF' }] as TAsset[];
    vi.mocked(getExchangeAssets).mockReturnValue(exchangeAssets);

    const result = getSupportedAssetsTo(dummyExchange, undefined);

    expect(getExchangeAssets).toHaveBeenCalledWith(dummyExchange);
    expect(result).toEqual(exchangeAssets);
  });

  it('should filter exchange assets based on "to" assets when exchange is not "Auto select"', () => {
    const dummyExchange: TExchangeNode = 'AcalaDex';
    const dummyNode = { node: 'Acala' } as ExchangeNode;
    vi.mocked(createDexNodeInstance).mockReturnValue(dummyNode);
    const exchangeAssets = [{ symbol: 'ABC' }, { symbol: 'DEF' }] as TAsset[];
    vi.mocked(getExchangeAssets).mockReturnValue(exchangeAssets);
    const toNode: TNodeWithRelayChains = 'Astar';
    vi.mocked(getAssets).mockReturnValue([{ symbol: 'abc' }] as TAsset[]);

    const result = getSupportedAssetsTo(dummyExchange, toNode);

    expect(getAssets).toHaveBeenCalledWith(toNode);
    expect(result).toEqual([{ symbol: 'ABC' }]);
  });

  it('should return flattened assets from all exchange nodes when exchange is "Auto select" and "to" is undefined', () => {
    const exchange = undefined;
    const node1 = 'Acala';
    const node2 = 'BifrostPolkadot';

    vi.mocked(createDexNodeInstance).mockImplementation((exchangeNode: TExchangeNode) => {
      if (exchangeNode === 'AcalaDex') return { node: node1 } as ExchangeNode;
      if (exchangeNode === 'BifrostPolkadotDex') return { node: node2 } as ExchangeNode;
      return {} as ExchangeNode;
    });

    const assets1 = [{ symbol: 'ABC' }] as TAsset[];
    const assets2 = [{ symbol: 'DEF' }] as TAsset[];
    vi.mocked(getExchangeAssets).mockImplementation((exchangeNode) => {
      if (exchangeNode === 'AcalaDex') return assets1;
      if (exchangeNode === 'BifrostPolkadotDex') return assets2;
      return [];
    });

    const result = getSupportedAssetsTo(exchange, undefined);

    expect(getExchangeAssets).toHaveBeenCalledTimes(EXCHANGE_NODES.length);
    expect(result).toEqual([...assets1, ...assets2]);
  });

  it('should filter flattened assets based on "to" assets when exchange is "Auto select"', () => {
    const exchange = undefined;
    const node1 = 'Acala';
    const node2 = 'BifrostPolkadot';

    vi.mocked(createDexNodeInstance).mockImplementation((exchangeNode: TExchangeNode) => {
      if (exchangeNode === 'AcalaDex') return { node: node1 } as ExchangeNode;
      if (exchangeNode === 'BifrostPolkadotDex') return { node: node2 } as ExchangeNode;
      return {} as ExchangeNode;
    });

    const assets1 = [{ symbol: 'ABC' }] as TAsset[];
    const assets2 = [{ symbol: 'DEF' }] as TAsset[];
    vi.mocked(getExchangeAssets).mockImplementation((exchangeNode) => {
      if (exchangeNode === 'AcalaDex') return assets1;
      if (exchangeNode === 'BifrostPolkadotDex') return assets2;
      return [];
    });

    const toNode = 'Astar';
    vi.mocked(getAssets).mockReturnValue([{ symbol: 'DEF' }] as TAsset[]);

    const result = getSupportedAssetsTo(exchange, toNode);

    expect(getAssets).toHaveBeenCalledWith(toNode);
    expect(result).toEqual([{ symbol: 'DEF' }]);
  });
});
