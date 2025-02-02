import { describe, expect, it, vi, beforeEach } from 'vitest';
import * as sdkPjs from '@paraspell/sdk-pjs';
import * as assetsModule from './assetsUtils';
import { getExchangeAssetByOriginAsset } from './getExchangeAssetByOriginAsset';

describe('getExchangeAssetByOriginAsset', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns undefined when no candidates are found by symbol', () => {
    vi.spyOn(sdkPjs, 'findBestMatches').mockReturnValue([]);

    const originAsset = { symbol: 'BTC' };
    const result = getExchangeAssetByOriginAsset('Acala', 'AcalaDex', originAsset);

    expect(result).toBeUndefined();
  });

  it('returns the single candidate when found by symbol', () => {
    const mockAsset = { symbol: 'DOT', id: '1' };
    vi.spyOn(sdkPjs, 'findBestMatches').mockReturnValue([mockAsset]);

    const isForeignAssetSpy = vi.spyOn(sdkPjs, 'isForeignAsset');

    const originAsset = { symbol: 'DOT' };
    const result = getExchangeAssetByOriginAsset('Acala', 'AcalaDex', originAsset);

    expect(result).toBe(mockAsset);
    expect(isForeignAssetSpy).not.toHaveBeenCalled();
  });

  it('returns undefined when multiple candidates exist and origin is not foreign', () => {
    const candidates = [{ symbol: 'DOT' }, { symbol: 'DOT' }];
    vi.spyOn(sdkPjs, 'findBestMatches').mockReturnValue(candidates);
    vi.spyOn(sdkPjs, 'isForeignAsset').mockReturnValue(false);

    const originAsset = { symbol: 'DOT' };
    const result = getExchangeAssetByOriginAsset('Acala', 'AcalaDex', originAsset);

    expect(result).toBeUndefined();
    expect(sdkPjs.isForeignAsset).toHaveBeenCalledWith(originAsset);
  });

  it('returns the candidate with matching multiLocation when origin is foreign', () => {
    const candidate1 = { symbol: 'DOT', id: '1' };
    const candidate2 = { symbol: 'DOT', id: '2' };
    vi.spyOn(sdkPjs, 'findBestMatches').mockReturnValue([candidate1, candidate2]);
    vi.spyOn(sdkPjs, 'isForeignAsset').mockReturnValue(true);
    vi.spyOn(sdkPjs, 'getAssetBySymbolOrId').mockImplementation((_node, currency) => {
      if ('id' in currency && currency.id === '1')
        return {
          symbol: 'DOT',
          multiLocation: 'ml1' as unknown as sdkPjs.TMultiLocation,
          xcmInterior: undefined,
        };
      return {
        symbol: 'DOT',
        multiLocation: 'ml2' as unknown as sdkPjs.TMultiLocation,
        xcmInterior: undefined,
      };
    });
    vi.spyOn(sdkPjs, 'deepEqual').mockReturnValue(true);

    const originAsset = {
      symbol: 'DOT',
      multiLocation: 'ml1' as unknown as sdkPjs.TMultiLocation,
    } as sdkPjs.TForeignAsset;
    const result = getExchangeAssetByOriginAsset('Acala', 'AcalaDex', originAsset);

    expect(result).toBe(candidate1);
    expect(sdkPjs.deepEqual).toHaveBeenCalledWith('ml1', 'ml1');
  });

  it('returns the candidate with matching XCM interior when origin is foreign', () => {
    const candidate1 = { symbol: 'DOT', id: '1', xcmInterior: ['junction1'] };
    const candidate2 = { symbol: 'DOT', id: '2', xcmInterior: ['junction2'] };
    vi.spyOn(sdkPjs, 'findBestMatches').mockReturnValue([candidate1, candidate2]);
    vi.spyOn(sdkPjs, 'isForeignAsset').mockReturnValue(true);
    vi.spyOn(sdkPjs, 'getAssetBySymbolOrId').mockImplementation((_node, currency) => {
      if ('id' in currency && currency.id === '1')
        return {
          multiLocation: { interior: 'junction1' as sdkPjs.TMultiLocation['interior'] },
          xcmInterior: undefined,
        } as sdkPjs.TForeignAsset;
      return {
        multiLocation: { interior: 'junction2' as sdkPjs.TMultiLocation['interior'] },
        xcmInterior: undefined,
      } as sdkPjs.TForeignAsset;
    });

    vi.spyOn(assetsModule, 'extractJunctions').mockImplementation((ml: sdkPjs.TMultiLocation) =>
      ml.interior === ('junction1' as sdkPjs.TMultiLocation['interior'])
        ? (['junction1'] as unknown as sdkPjs.TJunction[])
        : (['junction2'] as unknown as sdkPjs.TJunction[]),
    );
    vi.spyOn(assetsModule, 'compareXcmInteriors').mockReturnValue(true);

    const originAsset = {
      symbol: 'DOT',
      assetId: '1',
      xcmInterior: ['junction1'] as unknown as sdkPjs.TForeignAsset['xcmInterior'],
    } as sdkPjs.TForeignAsset;
    const result = getExchangeAssetByOriginAsset('Acala', 'AcalaDex', originAsset);

    expect(result).toBe(candidate1);
    expect(assetsModule.compareXcmInteriors).toHaveBeenCalledWith(['junction1'], ['junction1']);
  });

  it('returns undefined when no candidate matches multiLocation or XCM interior', () => {
    const candidate1 = { symbol: 'DOT', id: '1' };
    const candidate2 = { symbol: 'DOT', id: '2' };
    vi.spyOn(sdkPjs, 'findBestMatches').mockReturnValue([candidate1, candidate2]);
    vi.spyOn(sdkPjs, 'isForeignAsset').mockReturnValue(true);
    vi.spyOn(sdkPjs, 'getAssetBySymbolOrId').mockReturnValue({
      multiLocation: 'ml1' as unknown as sdkPjs.TMultiLocation,
    } as sdkPjs.TForeignAsset);
    vi.spyOn(sdkPjs, 'deepEqual').mockReturnValue(false);
    vi.spyOn(assetsModule, 'compareXcmInteriors').mockReturnValue(false);

    const originAsset = {
      symbol: 'DOT',
      multiLocation: 'ml2' as unknown as sdkPjs.TMultiLocation,
    } as sdkPjs.TForeignAsset;
    const result = getExchangeAssetByOriginAsset('Acala', 'AcalaDex', originAsset);

    expect(result).toBeUndefined();
  });

  it('skips candidates with undefined id', () => {
    const candidate = { symbol: 'DOT', id: undefined };
    vi.spyOn(sdkPjs, 'findBestMatches').mockReturnValue([candidate, candidate]);
    vi.spyOn(sdkPjs, 'isForeignAsset').mockReturnValue(true);

    const result = getExchangeAssetByOriginAsset('Acala', 'AcalaDex', {
      symbol: 'DOT',
    } as sdkPjs.TForeignAsset);

    expect(result).toBeUndefined();
    expect(sdkPjs.getAssetBySymbolOrId).not.toHaveBeenCalled();
  });

  it('skips candidates where SDK asset has no multiLocation or XCM interior', () => {
    const candidate = { symbol: 'DOT' };
    vi.spyOn(sdkPjs, 'findBestMatches').mockReturnValue([candidate, candidate]);
    vi.spyOn(sdkPjs, 'isForeignAsset').mockReturnValue(true);
    vi.spyOn(sdkPjs, 'getAssetBySymbolOrId').mockReturnValue({
      symbol: 'DOT',
      xcmInterior: [],
    } as sdkPjs.TForeignAsset);

    const result = getExchangeAssetByOriginAsset('Acala', 'AcalaDex', {
      symbol: 'DOT',
    } as sdkPjs.TForeignAsset);

    expect(result).toBeUndefined();
  });
});
