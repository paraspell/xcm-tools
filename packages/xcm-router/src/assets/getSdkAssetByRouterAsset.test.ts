import type { TAssetInfo, TCurrencyInput, TForeignAssetInfo, TLocation } from '@paraspell/sdk';
import {
  deepEqual,
  findAssetInfo,
  findBestMatches,
  getAssets,
  isForeignAsset,
} from '@paraspell/sdk';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { TRouterAsset } from '../types';
import { getSdkAssetByRouterAsset } from './getSdkAssetByRouterAsset';

const exchangeBaseChain = 'Acala';

vi.mock('@paraspell/sdk', () => ({
  getAssets: vi.fn(),
  findBestMatches: vi.fn(),
  findAssetInfo: vi.fn(),
  isForeignAsset: vi.fn(),
  deepEqual: (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b),
}));

describe('getSdkAssetByRouterAsset', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return undefined when no candidate is found', () => {
    vi.mocked(getAssets).mockReturnValue([{ symbol: 'ABC', assetId: '1' }]);
    vi.mocked(findBestMatches).mockReturnValue([]);
    const routerAsset: TRouterAsset = { symbol: 'XYZ' };
    const result = getSdkAssetByRouterAsset(exchangeBaseChain, routerAsset);
    expect(result).toBeUndefined();
  });

  it('should return candidate when exactly one candidate is found', () => {
    const candidate: TAssetInfo = { symbol: 'ABC', assetId: '1' };
    vi.mocked(getAssets).mockReturnValue([candidate]);
    vi.mocked(findBestMatches).mockReturnValue([candidate]);
    const routerAsset: TRouterAsset = { symbol: 'ABC', assetId: '1' };
    const result = getSdkAssetByRouterAsset(exchangeBaseChain, routerAsset);
    expect(result).toEqual(candidate);
  });

  it('should return undefined when multiple candidates are found and routerAsset has no id', () => {
    const candidate1: TAssetInfo = { symbol: 'ABC', assetId: '1' };
    const candidate2: TAssetInfo = { symbol: 'ABC', assetId: '2' };
    vi.mocked(getAssets).mockReturnValue([candidate1, candidate2]);
    vi.mocked(findBestMatches).mockReturnValue([candidate1, candidate2]);
    const routerAsset: TRouterAsset = { symbol: 'ABC' };
    const result = getSdkAssetByRouterAsset(exchangeBaseChain, routerAsset);
    expect(result).toBeUndefined();
  });

  it('should return a candidate when matching by location', () => {
    const location: TLocation = { parents: 0, interior: 'Here' };
    const candidate1: TForeignAssetInfo = { symbol: 'ABC', assetId: '1', location };
    const candidate2: TAssetInfo = { symbol: 'ABC', assetId: '2' };
    vi.mocked(getAssets).mockReturnValue([candidate1, candidate2]);
    vi.mocked(findBestMatches).mockReturnValue([candidate1, candidate2]);
    vi.mocked(isForeignAsset).mockImplementation((asset: TAssetInfo) =>
      Boolean((asset as TForeignAssetInfo).assetId),
    );
    vi.mocked(findAssetInfo).mockImplementation((_chain, currency: TCurrencyInput) => {
      if ('location' in currency && deepEqual(currency.location, candidate1.location)) {
        return candidate1;
      }
      return null;
    });
    const routerAsset: TRouterAsset = { symbol: 'ABC', assetId: '1', location };
    const result = getSdkAssetByRouterAsset(exchangeBaseChain, routerAsset);
    expect(result).toEqual({ ...candidate1, location });
  });

  it('should return a candidate when matching by assetId', () => {
    const candidate1: TForeignAssetInfo = { symbol: 'ABC', assetId: '1' };
    const candidate2: TForeignAssetInfo = { symbol: 'ABC', assetId: '2' };
    vi.mocked(getAssets).mockReturnValue([candidate1, candidate2]);
    vi.mocked(findBestMatches).mockReturnValue([candidate1, candidate2]);
    vi.mocked(isForeignAsset).mockImplementation(
      (asset: TAssetInfo) => (asset as TForeignAssetInfo).assetId === '2',
    );
    vi.mocked(findAssetInfo).mockImplementation((_chain, currency: TCurrencyInput) => {
      if ('id' in currency && currency.id === candidate2.assetId) return candidate2;
      return null;
    });
    const routerAsset: TRouterAsset = { symbol: 'ABC', assetId: '2' };
    const result = getSdkAssetByRouterAsset(exchangeBaseChain, routerAsset);
    expect(result).toEqual(candidate2);
  });

  it('should return undefined when multiple candidates are found but none match', () => {
    const candidate1: TForeignAssetInfo = {
      symbol: 'ABC',
      assetId: '1',
      location: { parents: 0, interior: 'Here' },
    };
    const candidate2: TForeignAssetInfo = {
      symbol: 'ABC',
      assetId: '2',
      location: { parents: 0, interior: 'Here' },
    };
    vi.mocked(getAssets).mockReturnValue([candidate1, candidate2]);
    vi.mocked(findBestMatches).mockReturnValue([candidate1, candidate2]);
    vi.mocked(isForeignAsset).mockReturnValue(true);
    vi.mocked(findAssetInfo).mockReturnValue(null);
    const routerAsset: TRouterAsset = {
      symbol: 'ABC',
      assetId: '1',
      location: candidate1.location,
    };
    const result = getSdkAssetByRouterAsset(exchangeBaseChain, routerAsset);
    expect(result).toBeUndefined();
  });
});
