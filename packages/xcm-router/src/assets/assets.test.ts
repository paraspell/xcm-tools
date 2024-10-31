import { describe, it, expect, vi } from 'vitest';
import {
  supportsCurrency,
  findAssetFrom,
  findAssetTo,
  getSupportedAssetsFrom,
  getSupportedAssetsTo,
} from './assets';
import type { TAsset, TCurrencyCore, TNodeWithRelayChains } from '@paraspell/sdk';
import { getAssets } from '@paraspell/sdk';
import type { TAutoSelect, TExchangeNode } from '../types';

vi.mock('@paraspell/sdk', () => ({
  getAssets: vi.fn(),
}));

describe('supportsCurrency', () => {
  it('should return true when currency is supported by exchange node', () => {
    const exchangeNode: TExchangeNode = 'HydrationDex';
    const currency = { symbol: 'HDX' } as TCurrencyCore;

    const result = supportsCurrency(exchangeNode, currency);
    expect(result).toBe(true);
  });

  it('should return false when currency is not supported by exchange node', () => {
    const exchangeNode: TExchangeNode = 'AcalaDex';
    const currency = { symbol: 'XYZ' } as TCurrencyCore;

    const result = supportsCurrency(exchangeNode, currency);
    expect(result).toBe(false);
  });
});

describe('findAssetFrom', () => {
  it('should return correct asset when found in node assets', () => {
    const fromNode = 'Hydration' as TNodeWithRelayChains;
    const currency = { symbol: 'ETH' } as TCurrencyCore;
    const assets = [{ symbol: 'ETH', assetId: 'eth-id' }];
    vi.mocked(getAssets).mockReturnValue(assets);

    const result = findAssetFrom(fromNode, undefined, currency);
    expect(result).toEqual({ symbol: 'ETH', assetId: 'eth-id' });
  });

  it('should return undefined when asset not found in node', () => {
    const fromNode = 'Hydration' as TNodeWithRelayChains;
    const currency = { symbol: 'BTC' } as TCurrencyCore;
    const assets = [{ symbol: 'ETH', assetId: 'eth-id' }];
    vi.mocked(getAssets).mockReturnValue(assets);

    const result = findAssetFrom(fromNode, undefined, currency);
    expect(result).toBeUndefined();
  });
});

describe('findAssetTo', () => {
  it('should return correct asset when found', () => {
    const fromNode: TNodeWithRelayChains = 'Acala';
    const exchange: TExchangeNode = 'HydrationDex';
    const toNode: TNodeWithRelayChains = 'Hydration';
    const currency = { symbol: 'USDT' } as TCurrencyCore;
    vi.mocked(getAssets).mockReturnValue([{ symbol: 'USDT', assetId: '10' }] as TAsset[]);

    const result = findAssetTo(exchange, fromNode, toNode, currency);
    expect(result).toEqual({ symbol: 'USDT', assetId: '10' });
  });
});

describe('getSupportedAssetsFrom', () => {
  it('should return assets from exchange that match node assets', () => {
    const fromNode = 'Acala' as TNodeWithRelayChains;
    const exchange: TExchangeNode = 'HydrationDex';
    const assets = [{ symbol: 'WUD', assetId: '1000085' }];
    vi.mocked(getAssets).mockReturnValue(assets);

    const result = getSupportedAssetsFrom(fromNode, exchange);
    expect(result).toEqual([{ symbol: 'WUD', assetId: '1000085' }]);
  });

  it('should return all assets from node when exchange is auto select', () => {
    const fromNode = 'Acala' as TNodeWithRelayChains;
    const exchange: TAutoSelect = 'Auto select';
    const assets = [{ symbol: 'ACA', assetId: '1000099' }];
    vi.mocked(getAssets).mockReturnValue(assets);

    const result = getSupportedAssetsFrom(fromNode, exchange);
    expect(result).toEqual([{ symbol: 'ACA', assetId: '1000099' }]);
  });
});

describe('getSupportedAssetsTo', () => {
  it('should return exchange assets that match node assets', () => {
    const fromNode: TNodeWithRelayChains = 'Hydration';
    const toNode = 'Acala' as TNodeWithRelayChains;
    const exchange: TExchangeNode = 'HydrationDex';
    const assets = [{ symbol: 'WUD', assetId: '1000085' }];
    vi.mocked(getAssets).mockReturnValue(assets);

    const result = getSupportedAssetsTo(fromNode, exchange, toNode);
    expect(result).toEqual([{ symbol: 'WUD', assetId: '1000085' }]);
  });

  it('should return all assets from node when exchange is auto select', () => {
    const fromNode: TNodeWithRelayChains = 'Hydration';
    const toNode = 'Acala' as TNodeWithRelayChains;
    const exchange: TAutoSelect = 'Auto select';
    const assets = [{ symbol: 'vASTR', assetId: '33' }];
    vi.mocked(getAssets).mockReturnValue(assets);

    const result = getSupportedAssetsTo(fromNode, exchange, toNode);
    expect(result).toEqual([{ symbol: 'vASTR', assetId: '33' }]);
  });
});
