import type { TCurrencyInput, TForeignAssetInfo, TNativeAssetInfo } from '@paraspell/sdk';
import {
  findAssetInfoById,
  findAssetInfoByLoc,
  findAssetInfoBySymbol,
  findBestMatches,
  getNativeAssets,
  getOtherAssets,
  isOverrideLocationSpecifier,
  isSymbolSpecifier,
} from '@paraspell/sdk';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import type { TRouterAsset } from '../types';
import { getExchangeAsset } from './getExchangeAsset';
import { getExchangeAssets } from './getExchangeConfig';

vi.mock('@paraspell/sdk', () => ({
  getOtherAssets: vi.fn(),
  getNativeAssets: vi.fn(),
  findAssetInfoBySymbol: vi.fn(),
  findAssetInfoByLoc: vi.fn(),
  findAssetInfoById: vi.fn(),
  findBestMatches: vi.fn(),
  isSymbolSpecifier: vi.fn(),
  isOverrideLocationSpecifier: vi.fn(),
  isForeignAsset: (_asset: TRouterAsset) => true,
  InvalidParameterError: class extends Error {},
}));

vi.mock('./getExchangeConfig', () => ({
  getExchangeAssets: vi.fn(),
}));

describe('getExchangeAsset', () => {
  const mockExchange = 'AcalaDex';
  const mockNativeAsset: TNativeAssetInfo = { symbol: 'DOT', decimals: 10, isNative: true };
  const mockForeignAsset: TForeignAssetInfo = {
    symbol: 'USDT',
    decimals: 6,
    assetId: '123',
    location: { parents: 1, interior: 'Here' },
  };

  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(getExchangeAssets).mockReturnValue([mockNativeAsset, mockForeignAsset]);
    vi.mocked(getOtherAssets).mockReturnValue([mockForeignAsset]);
    vi.mocked(getNativeAssets).mockReturnValue([mockNativeAsset]);
    vi.mocked(isOverrideLocationSpecifier).mockReturnValue(false);
    vi.mocked(isSymbolSpecifier).mockReturnValue(false);
  });

  test('should throw error for multiasset or override location currencies', () => {
    const currency = ['some-asset'] as unknown as TCurrencyInput;
    expect(() => getExchangeAsset(mockExchange, currency)).toThrowError(
      'XCM Router does not support location override or multi-asset currencies yet.',
    );

    const currency2 = { location: { override: true } } as unknown as TCurrencyInput;
    vi.mocked(isOverrideLocationSpecifier).mockReturnValue(true);
    expect(() => getExchangeAsset(mockExchange, currency2)).toThrowError(
      'XCM Router does not support location override or multi-asset currencies yet.',
    );
  });

  test('should throw error when using symbol specifier', () => {
    const currency = { symbol: { Token: 'DOT' } } as unknown as TCurrencyInput;
    vi.mocked(isSymbolSpecifier).mockReturnValue(true);

    expect(() => getExchangeAsset(mockExchange, currency)).toThrowError(
      'Cannot use currency specifiers when using exchange auto select',
    );
  });

  test('should find asset by symbol', () => {
    const currency = { symbol: 'DOT' };
    vi.mocked(findAssetInfoBySymbol).mockReturnValue(mockNativeAsset);
    vi.mocked(findBestMatches).mockReturnValue([mockNativeAsset]);

    const result = getExchangeAsset(mockExchange, currency);
    expect(result).toEqual(mockNativeAsset);
    expect(findAssetInfoBySymbol).toHaveBeenCalled();
  });

  test('should throw on duplicate symbols when flag is set', () => {
    const currency = { symbol: 'DOT' } as TCurrencyInput;
    vi.mocked(findBestMatches).mockReturnValue([mockNativeAsset, mockNativeAsset]);

    expect(() => getExchangeAsset(mockExchange, currency, true)).toThrowError(
      `Multiple assets found for symbol DOT. Please specify the asset by location.`,
    );
  });

  test('should find asset by location', () => {
    const location = { parents: 1, interior: 'Here' };
    const currency = { location } as TCurrencyInput;
    vi.mocked(findAssetInfoByLoc).mockReturnValue(mockForeignAsset);

    const result = getExchangeAsset(mockExchange, currency);
    expect(result).toEqual(mockForeignAsset);
    expect(findAssetInfoByLoc).toHaveBeenCalled();
  });

  test('should find native asset by location', () => {
    const location = { parents: 0, interior: 'Here' };
    const currency = { location } as TCurrencyInput;

    vi.mocked(findAssetInfoByLoc)
      .mockReturnValueOnce(undefined)
      .mockReturnValueOnce(mockNativeAsset as TForeignAssetInfo);

    const result = getExchangeAsset(mockExchange, currency);

    expect(result).toEqual(mockNativeAsset);
    expect(findAssetInfoByLoc).toHaveBeenCalledTimes(2);
    expect(findAssetInfoByLoc).toHaveBeenNthCalledWith(1, expect.any(Array), location);
    expect(findAssetInfoByLoc).toHaveBeenNthCalledWith(2, expect.any(Array), location);
  });

  test('should find asset by id', () => {
    const currency = { id: '123' };
    vi.mocked(findAssetInfoById).mockReturnValue(mockForeignAsset);

    const result = getExchangeAsset(mockExchange, currency);
    expect(result).toEqual(mockForeignAsset);
    expect(findAssetInfoById).toHaveBeenCalled();
  });

  test('should return null when asset not found', () => {
    const currency = { symbol: 'UNKNOWN' };
    vi.mocked(findAssetInfoBySymbol).mockReturnValue(undefined);

    const result = getExchangeAsset(mockExchange, currency);
    expect(result).toBeNull();
  });

  test('should throw error for invalid currency input', () => {
    const currency = {} as TCurrencyInput;

    expect(() => getExchangeAsset(mockExchange, currency)).toThrowError('Invalid currency input');
  });

  test('should enhance foreign assets with location from otherAssets', () => {
    const foreignAssetWithoutLocation = {
      ...mockForeignAsset,
      location: undefined,
    } as TForeignAssetInfo;
    const otherAssets = [mockForeignAsset];

    vi.mocked(getExchangeAssets).mockReturnValue([foreignAssetWithoutLocation]);
    vi.mocked(getOtherAssets).mockReturnValue(otherAssets);

    getExchangeAsset(mockExchange, { symbol: 'USDT' });

    expect(findAssetInfoBySymbol).toHaveBeenCalled();
  });
});
