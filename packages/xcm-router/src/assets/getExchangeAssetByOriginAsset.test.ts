import * as sdk from '@paraspell/sdk';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { getExchangeAssetByOriginAsset } from './getExchangeAssetByOriginAsset';

describe('getExchangeAssetByOriginAsset', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns undefined when no candidates are found by symbol', () => {
    vi.spyOn(sdk, 'findBestMatches').mockReturnValue([]);

    const originAsset = { symbol: 'BTC' } as sdk.TAssetInfo;
    const result = getExchangeAssetByOriginAsset('Acala', 'AcalaDex', originAsset);

    expect(result).toBeUndefined();
  });

  it('returns the single candidate when found by symbol', () => {
    const mockAsset = { symbol: 'DOT', id: '1' };
    vi.spyOn(sdk, 'findBestMatches').mockReturnValue([mockAsset]);

    const isForeignAssetSpy = vi.spyOn(sdk, 'isForeignAsset');

    const originAsset = { symbol: 'DOT' } as sdk.TAssetInfo;
    const result = getExchangeAssetByOriginAsset('Acala', 'AcalaDex', originAsset);

    expect(result).toBe(mockAsset);
    expect(isForeignAssetSpy).not.toHaveBeenCalled();
  });

  it('returns undefined when multiple candidates exist and origin is not foreign', () => {
    const candidates = [{ symbol: 'DOT' }, { symbol: 'DOT' }];
    vi.spyOn(sdk, 'findBestMatches').mockReturnValue(candidates);
    vi.spyOn(sdk, 'isForeignAsset').mockReturnValue(false);

    const originAsset = { symbol: 'DOT' } as sdk.TAssetInfo;
    const result = getExchangeAssetByOriginAsset('Acala', 'AcalaDex', originAsset);

    expect(result).toBeUndefined();
    expect(sdk.isForeignAsset).toHaveBeenCalledWith(originAsset);
  });

  it('returns the candidate with matching location when origin is foreign', () => {
    const candidate1 = { symbol: 'DOT', assetId: '1' };
    const candidate2 = { symbol: 'DOT', assetId: '2' };
    vi.spyOn(sdk, 'findBestMatches').mockReturnValue([candidate1, candidate2]);
    vi.spyOn(sdk, 'isForeignAsset').mockReturnValue(true);
    vi.spyOn(sdk, 'findAssetInfo').mockImplementation((_chain, currency) => {
      if ('id' in currency && currency.id === '1')
        return {
          symbol: 'DOT',
          decimals: 12,
          location: 'ml1' as unknown as sdk.TLocation,
        };
      return {
        symbol: 'DOT',
        decimals: 12,
        location: 'ml2' as unknown as sdk.TLocation,
      };
    });
    vi.spyOn(sdk, 'deepEqual').mockReturnValue(true);

    const originAsset = {
      symbol: 'DOT',
      location: 'ml1' as unknown as sdk.TLocation,
    } as sdk.TForeignAssetInfo;
    const result = getExchangeAssetByOriginAsset('Acala', 'AcalaDex', originAsset);

    expect(result).toStrictEqual({
      ...candidate1,
      location: 'ml1',
    });
    expect(sdk.deepEqual).toHaveBeenCalledWith('ml1', 'ml1');
  });

  it('returns undefined when no candidate matches location', () => {
    const candidate1 = { symbol: 'DOT', id: '1' };
    const candidate2 = { symbol: 'DOT', id: '2' };
    vi.spyOn(sdk, 'findBestMatches').mockReturnValue([candidate1, candidate2]);
    vi.spyOn(sdk, 'isForeignAsset').mockReturnValue(true);
    vi.spyOn(sdk, 'findAssetInfo').mockReturnValue({
      location: 'ml1' as unknown as sdk.TLocation,
    } as sdk.TForeignAssetInfo);
    vi.spyOn(sdk, 'deepEqual').mockReturnValue(false);

    const originAsset = {
      symbol: 'DOT',
      location: 'ml2' as unknown as sdk.TLocation,
    } as sdk.TForeignAssetInfo;
    const result = getExchangeAssetByOriginAsset('Acala', 'AcalaDex', originAsset);

    expect(result).toBeUndefined();
  });

  it('skips candidates with undefined id', () => {
    const candidate = { symbol: 'DOT', id: undefined };
    vi.spyOn(sdk, 'findBestMatches').mockReturnValue([candidate, candidate]);
    vi.spyOn(sdk, 'isForeignAsset').mockReturnValue(true);

    const result = getExchangeAssetByOriginAsset('Acala', 'AcalaDex', {
      symbol: 'DOT',
    } as sdk.TForeignAssetInfo);

    expect(result).toBeUndefined();
    expect(sdk.findAssetInfo).not.toHaveBeenCalled();
  });

  it('skips candidates where SDK asset has no location or XCM interior', () => {
    const candidate = { symbol: 'DOT' };
    vi.spyOn(sdk, 'findBestMatches').mockReturnValue([candidate, candidate]);
    vi.spyOn(sdk, 'isForeignAsset').mockReturnValue(true);
    vi.spyOn(sdk, 'findAssetInfo').mockReturnValue({
      symbol: 'DOT',
    } as sdk.TForeignAssetInfo);

    const result = getExchangeAssetByOriginAsset('Acala', 'AcalaDex', {
      symbol: 'DOT',
    } as sdk.TForeignAssetInfo);

    expect(result).toBeUndefined();
  });

  it('returns undefined when origin is foreign but lacks location while sdkAsset has location', () => {
    const candidate1 = { symbol: 'DOT', id: '1' };
    const candidate2 = { symbol: 'DOT', id: '2' };

    vi.spyOn(sdk, 'findBestMatches').mockReturnValue([candidate1, candidate2]);
    vi.spyOn(sdk, 'isForeignAsset').mockReturnValue(true);
    vi.spyOn(sdk, 'findAssetInfo').mockReturnValue({
      symbol: 'DOT',
      location: 'ml1' as unknown as sdk.TLocation,
    } as sdk.TForeignAssetInfo);

    const originAsset = { symbol: 'DOT' } as sdk.TForeignAssetInfo;

    const result = getExchangeAssetByOriginAsset('Acala', 'AcalaDex', originAsset);
    expect(result).toBeUndefined();
  });
});
