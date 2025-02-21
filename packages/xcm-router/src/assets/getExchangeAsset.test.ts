import { beforeEach, describe, expect, test, vi } from 'vitest';
import type {
  TCurrencyInput,
  TForeignAsset,
  TMultiLocation,
  TNativeAsset,
  TNodePolkadotKusama,
} from '@paraspell/sdk-pjs';
import {
  getOtherAssets,
  findAssetBySymbol,
  findAssetByMultiLocation,
  findAssetById,
  findBestMatches,
  isSymbolSpecifier,
  isOverrideMultiLocationSpecifier,
  getNativeAssets,
} from '@paraspell/sdk-pjs';
import type { TRouterAsset } from '../types';
import { getExchangeAssets } from './getExchangeAssets';
import { getExchangeAsset } from './getExchangeAsset';

vi.mock('@paraspell/sdk-pjs', () => ({
  getOtherAssets: vi.fn(),
  getNativeAssets: vi.fn(),
  findAssetBySymbol: vi.fn(),
  findAssetByMultiLocation: vi.fn(),
  findAssetById: vi.fn(),
  findBestMatches: vi.fn(),
  isSymbolSpecifier: vi.fn(),
  isOverrideMultiLocationSpecifier: vi.fn(),
  isForeignAsset: (_asset: TRouterAsset) => true,
}));

vi.mock('./getExchangeAssets', () => ({
  getExchangeAssets: vi.fn(),
}));

describe('getExchangeAsset', () => {
  const mockExchangeBaseNode = 'polkadot' as TNodePolkadotKusama;
  const mockExchange = 'AcalaDex';
  const mockNativeAsset: TNativeAsset = { symbol: 'DOT', isNative: true };
  const mockForeignAsset: TForeignAsset = {
    symbol: 'USDT',
    assetId: '123',
    multiLocation: { parents: 1, interior: 'Here' },
  };

  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(getExchangeAssets).mockReturnValue([mockNativeAsset, mockForeignAsset]);
    vi.mocked(getOtherAssets).mockReturnValue([mockForeignAsset]);
    vi.mocked(getNativeAssets).mockReturnValue([mockNativeAsset]);
    vi.mocked(isOverrideMultiLocationSpecifier).mockReturnValue(false);
    vi.mocked(isSymbolSpecifier).mockReturnValue(false);
  });

  test('should throw error for multiasset or override multilocation currencies', () => {
    const currency = { multiasset: 'some-asset' } as unknown as TCurrencyInput;
    expect(() => getExchangeAsset(mockExchangeBaseNode, mockExchange, currency)).toThrowError(
      'XCM Router does not support multi-location override or multi-asset currencies yet.',
    );

    const currency2 = { multilocation: { override: true } } as unknown as TCurrencyInput;
    vi.mocked(isOverrideMultiLocationSpecifier).mockReturnValue(true);
    expect(() => getExchangeAsset(mockExchangeBaseNode, mockExchange, currency2)).toThrowError(
      'XCM Router does not support multi-location override or multi-asset currencies yet.',
    );
  });

  test('should throw error when using symbol specifier', () => {
    const currency = { symbol: { Token: 'DOT' } } as unknown as TCurrencyInput;
    vi.mocked(isSymbolSpecifier).mockReturnValue(true);

    expect(() => getExchangeAsset(mockExchangeBaseNode, mockExchange, currency)).toThrowError(
      'Cannot use currency specifiers when using exchange auto select',
    );
  });

  test('should find asset by symbol', () => {
    const currency = { symbol: 'DOT' };
    vi.mocked(findAssetBySymbol).mockReturnValue(mockNativeAsset);
    vi.mocked(findBestMatches).mockReturnValue([mockNativeAsset]);

    const result = getExchangeAsset(mockExchangeBaseNode, mockExchange, currency);
    expect(result).toEqual(mockNativeAsset);
    expect(findAssetBySymbol).toHaveBeenCalled();
  });

  test('should throw on duplicate symbols when flag is set', () => {
    const currency = { symbol: 'DOT' } as TCurrencyInput;
    vi.mocked(findBestMatches).mockReturnValue([mockNativeAsset, mockNativeAsset]);

    expect(() => getExchangeAsset(mockExchangeBaseNode, mockExchange, currency, true)).toThrowError(
      `Multiple assets found for symbol DOT. Please specify the asset by Multi-Location.`,
    );
  });

  test('should find asset by multilocation', () => {
    const multiLocation = { parents: 1, interior: 'Here' };
    const currency = { multilocation: multiLocation } as TCurrencyInput;
    vi.mocked(findAssetByMultiLocation).mockReturnValue(mockForeignAsset);

    const result = getExchangeAsset(mockExchangeBaseNode, mockExchange, currency);
    expect(result).toEqual(mockForeignAsset);
    expect(findAssetByMultiLocation).toHaveBeenCalled();
  });

  test('should find native asset by multilocation', () => {
    const multiLocation = { parents: 0, interior: 'Here' } as TMultiLocation;
    const currency = { multilocation: multiLocation } as TCurrencyInput;

    vi.mocked(findAssetByMultiLocation)
      .mockReturnValueOnce(undefined)
      .mockReturnValueOnce(mockNativeAsset as TForeignAsset);

    const result = getExchangeAsset(mockExchangeBaseNode, mockExchange, currency);

    expect(result).toEqual(mockNativeAsset);
    expect(findAssetByMultiLocation).toHaveBeenCalledTimes(2);
    expect(findAssetByMultiLocation).toHaveBeenNthCalledWith(1, expect.any(Array), multiLocation);
    expect(findAssetByMultiLocation).toHaveBeenNthCalledWith(2, expect.any(Array), multiLocation);
  });

  test('should find asset by id', () => {
    const currency = { id: '123' };
    vi.mocked(findAssetById).mockReturnValue(mockForeignAsset);

    const result = getExchangeAsset(mockExchangeBaseNode, mockExchange, currency);
    expect(result).toEqual(mockForeignAsset);
    expect(findAssetById).toHaveBeenCalled();
  });

  test('should return null when asset not found', () => {
    const currency = { symbol: 'UNKNOWN' };
    vi.mocked(findAssetBySymbol).mockReturnValue(undefined);

    const result = getExchangeAsset(mockExchangeBaseNode, mockExchange, currency);
    expect(result).toBeNull();
  });

  test('should throw error for invalid currency input', () => {
    const currency = {} as TCurrencyInput;

    expect(() => getExchangeAsset(mockExchangeBaseNode, mockExchange, currency)).toThrowError(
      'Invalid currency input',
    );
  });

  test('should enhance foreign assets with multiLocation from otherAssets', () => {
    const foreignAssetWithoutLocation = {
      ...mockForeignAsset,
      multiLocation: undefined,
    } as TForeignAsset;
    const otherAssets = [mockForeignAsset];

    vi.mocked(getExchangeAssets).mockReturnValue([foreignAssetWithoutLocation]);
    vi.mocked(getOtherAssets).mockReturnValue(otherAssets);

    getExchangeAsset(mockExchangeBaseNode, mockExchange, { symbol: 'USDT' });

    expect(findAssetBySymbol).toHaveBeenCalled();
  });
});
