import type { TAssetInfo, TForeignAssetInfo, TLocation } from '@paraspell/sdk';
import { deepEqual, findAssetInfo, findBestMatches, isForeignAsset } from '@paraspell/sdk';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { getExchangeAssetByOriginAsset } from './getExchangeAssetByOriginAsset';

vi.mock('@paraspell/sdk', async (importActual) => {
  const actual = await importActual<typeof import('@paraspell/sdk')>();
  return {
    ...actual,
    findBestMatches: vi.fn(actual.findBestMatches),
    isForeignAsset: vi.fn(actual.isForeignAsset),
    findAssetInfo: vi.fn(actual.findAssetInfo),
    deepEqual: vi.fn(actual.deepEqual),
  };
});

describe('getExchangeAssetByOriginAsset', () => {
  const DOT_ASSET = {
    symbol: 'DOT',
    decimals: 10,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns undefined when no candidates are found by symbol', () => {
    vi.mocked(findBestMatches).mockReturnValue([]);

    const originAsset = { symbol: 'BTC' } as TAssetInfo;
    const result = getExchangeAssetByOriginAsset('Acala', 'AcalaDex', originAsset);

    expect(result).toBeUndefined();
  });

  it('returns the single candidate when found by symbol', () => {
    const mockAsset = { ...DOT_ASSET, id: '1' };
    vi.mocked(findBestMatches).mockReturnValue([mockAsset]);

    const originAsset = { symbol: 'DOT' } as TAssetInfo;
    const result = getExchangeAssetByOriginAsset('Acala', 'AcalaDex', originAsset);

    expect(result).toBe(mockAsset);
    expect(isForeignAsset).not.toHaveBeenCalled();
  });

  it('returns undefined when multiple candidates exist and origin is not foreign', () => {
    const candidates = [DOT_ASSET, DOT_ASSET];
    vi.mocked(findBestMatches).mockReturnValue(candidates);
    vi.mocked(isForeignAsset).mockReturnValue(false);

    const originAsset = { symbol: 'DOT' } as TAssetInfo;
    const result = getExchangeAssetByOriginAsset('Acala', 'AcalaDex', originAsset);

    expect(result).toBeUndefined();
    expect(isForeignAsset).toHaveBeenCalledWith(originAsset);
  });

  it('returns the candidate with matching location when origin is foreign', () => {
    const candidate1 = { ...DOT_ASSET, assetId: '1' };
    const candidate2 = { ...DOT_ASSET, assetId: '2' };
    vi.mocked(findBestMatches).mockReturnValue([candidate1, candidate2]);
    vi.mocked(isForeignAsset).mockReturnValue(true);
    vi.mocked(findAssetInfo).mockImplementation((_chain, currency) => {
      if ('id' in currency && currency.id === '1')
        return {
          ...DOT_ASSET,
          location: 'ml1' as unknown as TLocation,
        };
      return {
        ...DOT_ASSET,
        location: 'ml2' as unknown as TLocation,
      };
    });
    vi.mocked(deepEqual).mockReturnValue(true);

    const originAsset = {
      symbol: 'DOT',
      location: 'ml1' as unknown as TLocation,
    } as TForeignAssetInfo;
    const result = getExchangeAssetByOriginAsset('Acala', 'AcalaDex', originAsset);

    expect(result).toStrictEqual({
      ...candidate1,
      location: 'ml1',
    });
    expect(deepEqual).toHaveBeenCalledWith('ml1', 'ml1');
  });

  it('returns undefined when no candidate matches location', () => {
    const candidate1 = { ...DOT_ASSET, id: '1' };
    const candidate2 = { ...DOT_ASSET, id: '2' };
    vi.mocked(findBestMatches).mockReturnValue([candidate1, candidate2]);
    vi.mocked(isForeignAsset).mockReturnValue(true);
    vi.mocked(findAssetInfo).mockReturnValue({
      location: 'ml1' as unknown as TLocation,
    } as TForeignAssetInfo);
    vi.mocked(deepEqual).mockReturnValue(false);

    const originAsset = {
      ...DOT_ASSET,
      location: 'ml2' as unknown as TLocation,
    } as TForeignAssetInfo;
    const result = getExchangeAssetByOriginAsset('Acala', 'AcalaDex', originAsset);

    expect(result).toBeUndefined();
  });

  it('skips candidates with undefined id', () => {
    const candidate = { ...DOT_ASSET, id: undefined };
    vi.mocked(findBestMatches).mockReturnValue([candidate, candidate]);
    vi.mocked(isForeignAsset).mockReturnValue(true);

    const result = getExchangeAssetByOriginAsset(
      'Acala',
      'AcalaDex',
      DOT_ASSET as TForeignAssetInfo,
    );

    expect(result).toBeUndefined();
    expect(findAssetInfo).not.toHaveBeenCalled();
  });

  it('skips candidates where SDK asset has no location or XCM interior', () => {
    const candidate = DOT_ASSET;
    vi.mocked(findBestMatches).mockReturnValue([candidate, candidate]);
    vi.mocked(isForeignAsset).mockReturnValue(true);
    vi.mocked(findAssetInfo).mockReturnValue(DOT_ASSET as TForeignAssetInfo);

    const result = getExchangeAssetByOriginAsset(
      'Acala',
      'AcalaDex',
      DOT_ASSET as TForeignAssetInfo,
    );

    expect(result).toBeUndefined();
  });

  it('returns undefined when origin is foreign but lacks location while sdkAsset has location', () => {
    const candidate1 = { ...DOT_ASSET, id: '1' };
    const candidate2 = { ...DOT_ASSET, id: '2' };

    vi.mocked(findBestMatches).mockReturnValue([candidate1, candidate2]);
    vi.mocked(isForeignAsset).mockReturnValue(true);
    vi.mocked(findAssetInfo).mockReturnValue({
      ...DOT_ASSET,
      location: 'ml1' as unknown as TLocation,
    } as TForeignAssetInfo);

    const originAsset = DOT_ASSET as TForeignAssetInfo;

    const result = getExchangeAssetByOriginAsset('Acala', 'AcalaDex', originAsset);
    expect(result).toBeUndefined();
  });
});
