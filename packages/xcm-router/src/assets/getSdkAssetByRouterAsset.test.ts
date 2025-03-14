import type { TAsset, TCurrencyInput, TForeignAsset, TMultiLocation } from '@paraspell/sdk-pjs';
import {
  deepEqual,
  findAsset,
  findBestMatches,
  getAssets,
  isForeignAsset,
} from '@paraspell/sdk-pjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { TRouterAsset } from '../types';
import { getSdkAssetByRouterAsset } from './getSdkAssetByRouterAsset';

const exchangeBaseNode = 'Acala';

vi.mock('@paraspell/sdk-pjs', () => ({
  getAssets: vi.fn(),
  findBestMatches: vi.fn(),
  findAsset: vi.fn(),
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
    const result = getSdkAssetByRouterAsset(exchangeBaseNode, routerAsset);
    expect(result).toBeUndefined();
  });

  it('should return candidate when exactly one candidate is found', () => {
    const candidate: TAsset = { symbol: 'ABC', assetId: '1' };
    vi.mocked(getAssets).mockReturnValue([candidate]);
    vi.mocked(findBestMatches).mockReturnValue([candidate]);
    const routerAsset: TRouterAsset = { symbol: 'ABC', id: '1' };
    const result = getSdkAssetByRouterAsset(exchangeBaseNode, routerAsset);
    expect(result).toEqual(candidate);
  });

  it('should return undefined when multiple candidates are found and routerAsset has no id', () => {
    const candidate1: TAsset = { symbol: 'ABC', assetId: '1' };
    const candidate2: TAsset = { symbol: 'ABC', assetId: '2' };
    vi.mocked(getAssets).mockReturnValue([candidate1, candidate2]);
    vi.mocked(findBestMatches).mockReturnValue([candidate1, candidate2]);
    const routerAsset: TRouterAsset = { symbol: 'ABC' };
    const result = getSdkAssetByRouterAsset(exchangeBaseNode, routerAsset);
    expect(result).toBeUndefined();
  });

  it('should return a candidate when matching by multiLocation', () => {
    const multiLoc: TMultiLocation = { parents: 0, interior: 'Here' };
    const candidate1: TForeignAsset = { symbol: 'ABC', assetId: '1', multiLocation: multiLoc };
    const candidate2: TAsset = { symbol: 'ABC', assetId: '2' };
    vi.mocked(getAssets).mockReturnValue([candidate1, candidate2]);
    vi.mocked(findBestMatches).mockReturnValue([candidate1, candidate2]);
    vi.mocked(isForeignAsset).mockImplementation((asset: TAsset) =>
      Boolean((asset as TForeignAsset).assetId),
    );
    vi.mocked(findAsset).mockImplementation((_node, currency: TCurrencyInput) => {
      if (
        'multilocation' in currency &&
        deepEqual(currency.multilocation, candidate1.multiLocation)
      ) {
        return candidate1;
      }
      return null;
    });
    const routerAsset: TRouterAsset = { symbol: 'ABC', id: '1', multiLocation: multiLoc };
    const result = getSdkAssetByRouterAsset(exchangeBaseNode, routerAsset);
    expect(result).toEqual({ ...candidate1, multiLocation: multiLoc });
  });

  it('should return a candidate when matching by assetId', () => {
    const candidate1: TForeignAsset = { symbol: 'ABC', assetId: '1' };
    const candidate2: TForeignAsset = { symbol: 'ABC', assetId: '2' };
    vi.mocked(getAssets).mockReturnValue([candidate1, candidate2]);
    vi.mocked(findBestMatches).mockReturnValue([candidate1, candidate2]);
    vi.mocked(isForeignAsset).mockImplementation(
      (asset: TAsset) => (asset as TForeignAsset).assetId === '2',
    );
    vi.mocked(findAsset).mockImplementation((_node, currency: TCurrencyInput) => {
      if ('id' in currency && currency.id === candidate2.assetId) return candidate2;
      return null;
    });
    const routerAsset: TRouterAsset = { symbol: 'ABC', id: '2' };
    const result = getSdkAssetByRouterAsset(exchangeBaseNode, routerAsset);
    expect(result).toEqual(candidate2);
  });

  it('should return undefined when multiple candidates are found but none match', () => {
    const candidate1: TForeignAsset = {
      symbol: 'ABC',
      assetId: '1',
      multiLocation: { parents: 0, interior: 'Here' },
    };
    const candidate2: TForeignAsset = {
      symbol: 'ABC',
      assetId: '2',
      multiLocation: { parents: 0, interior: 'There' },
    };
    vi.mocked(getAssets).mockReturnValue([candidate1, candidate2]);
    vi.mocked(findBestMatches).mockReturnValue([candidate1, candidate2]);
    vi.mocked(isForeignAsset).mockReturnValue(true);
    vi.mocked(findAsset).mockReturnValue(null);
    const routerAsset: TRouterAsset = {
      symbol: 'ABC',
      id: '1',
      multiLocation: candidate1.multiLocation,
    };
    const result = getSdkAssetByRouterAsset(exchangeBaseNode, routerAsset);
    expect(result).toBeUndefined();
  });
});
