import { findAsset, hasSupportForAsset, type TAsset, type TCurrencyInput } from '@paraspell/sdk';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { getExchangeAsset, getExchangeAssetByOriginAsset } from '../../assets';
import type ExchangeNode from '../../dexNodes/DexNode';
import type { TExchangeNode, TTransferOptions } from '../../types';
import { resolveAssets } from './resolveAssets';

vi.mock('@paraspell/sdk', () => ({
  findAsset: vi.fn(),
  hasSupportForAsset: vi.fn(),
}));

vi.mock('../../assets', () => ({
  getExchangeAsset: vi.fn(),
  getExchangeAssetByOriginAsset: vi.fn(),
}));

const dex = {
  node: 'NODE_A',
  exchangeNode: 'EXCHANGE_NODE_B',
} as unknown as ExchangeNode;

beforeEach(() => {
  vi.clearAllMocks();
});

describe('resolveAssets', () => {
  it('returns correct assets when origin is not specified', () => {
    const options = {
      from: undefined,
      to: undefined,
      currencyFrom: { symbol: 'BTC' },
      currencyTo: { symbol: 'ETH' },
    } as unknown as TTransferOptions;

    const mockAssetFromExchange = { symbol: 'BTC_EXCHANGE' };
    const mockAssetTo = { symbol: 'ETH_EXCHANGE' };

    vi.mocked(getExchangeAsset).mockImplementation(
      (_exchangeNode: TExchangeNode, currency: TCurrencyInput) => {
        if ('symbol' in currency && currency.symbol === 'BTC') return mockAssetFromExchange;
        if ('symbol' in currency && currency.symbol === 'ETH') return mockAssetTo;
        return null;
      },
    );

    const result = resolveAssets(dex, options);
    expect(result).toEqual({
      assetFromOrigin: undefined,
      assetFromExchange: mockAssetFromExchange,
      assetTo: mockAssetTo,
    });
  });

  it('returns correct assets when origin is specified and found', () => {
    const options = {
      from: 'CUSTOM_NODE',
      to: undefined,
      currencyFrom: { symbol: 'BTC' },
      currencyTo: { symbol: 'ETH' },
    } as unknown as TTransferOptions;

    const mockAssetFromOrigin = { symbol: 'BTC_ORIGIN' } as TAsset;
    const mockAssetFromExchange = { symbol: 'BTC_EXCHANGE' };
    const mockAssetTo = { symbol: 'ETH_EXCHANGE' };

    vi.mocked(findAsset).mockReturnValueOnce(mockAssetFromOrigin);
    vi.mocked(getExchangeAssetByOriginAsset).mockReturnValueOnce(mockAssetFromExchange);
    vi.mocked(getExchangeAsset).mockImplementation(
      (_exchangeNode: TExchangeNode, currency: TCurrencyInput) => {
        if ('symbol' in currency && currency.symbol === 'ETH') return mockAssetTo;
        return null;
      },
    );

    const result = resolveAssets(dex, options);
    expect(result).toEqual({
      assetFromOrigin: mockAssetFromOrigin,
      assetFromExchange: mockAssetFromExchange,
      assetTo: mockAssetTo,
    });
  });

  it('throws error when origin is specified but asset from origin is not found', () => {
    const options = {
      from: 'CUSTOM_NODE',
      to: undefined,
      currencyFrom: { symbol: 'BTC' },
      currencyTo: { symbol: 'ETH' },
    } as unknown as TTransferOptions;

    vi.mocked(findAsset).mockReturnValueOnce(null);
    expect(() => resolveAssets(dex, options)).toThrowError();
  });

  it('throws error when asset from exchange is not found (origin specified)', () => {
    const options = {
      from: 'CUSTOM_NODE',
      to: undefined,
      currencyFrom: { symbol: 'BTC' },
      currencyTo: { symbol: 'ETH' },
    } as unknown as TTransferOptions;

    const mockAssetFromOrigin = { symbol: 'BTC_ORIGIN' } as TAsset;
    vi.mocked(findAsset).mockReturnValueOnce(mockAssetFromOrigin);
    vi.mocked(getExchangeAssetByOriginAsset).mockReturnValueOnce(undefined);

    expect(() => resolveAssets(dex, options)).toThrowError();
  });

  it('throws error when asset from exchange is not found (non-origin specified)', () => {
    const options = {
      from: undefined,
      to: undefined,
      currencyFrom: { symbol: 'BTC' },
      currencyTo: { symbol: 'ETH' },
    } as unknown as TTransferOptions;

    vi.mocked(getExchangeAsset).mockImplementation(
      (_exchangeNode: TExchangeNode, currency: TCurrencyInput) => {
        if ('symbol' in currency && currency.symbol === 'BTC') return null;
        if ('symbol' in currency && currency.symbol === 'ETH') return { symbol: 'ETH_EXCHANGE' };
        return null;
      },
    );

    expect(() => resolveAssets(dex, options)).toThrowError();
  });

  it('throws error when asset to is not found', () => {
    const options = {
      from: undefined,
      to: undefined,
      currencyFrom: { symbol: 'BTC' },
      currencyTo: { symbol: 'ETH' },
    } as unknown as TTransferOptions;

    vi.mocked(getExchangeAsset).mockImplementation(
      (_exchangeNode: TExchangeNode, currency: TCurrencyInput) => {
        if ('symbol' in currency && currency.symbol === 'BTC') return { symbol: 'BTC_EXCHANGE' };
        if ('symbol' in currency && currency.symbol === 'ETH') return null;
        return null;
      },
    );

    expect(() => resolveAssets(dex, options)).toThrowError();
  });

  it('throws error when destination specified and asset to is not supported', () => {
    const options = {
      from: undefined,
      to: 'CUSTOM_DEST',
      currencyFrom: { symbol: 'BTC' },
      currencyTo: { symbol: 'ETH' },
    } as unknown as TTransferOptions;

    const mockAssetFromExchange = { symbol: 'BTC_EXCHANGE' };
    const mockAssetTo = { symbol: 'ETH_EXCHANGE' };

    vi.mocked(getExchangeAsset).mockImplementation(
      (_exchangeNode: TExchangeNode, currency: TCurrencyInput) => {
        if ('symbol' in currency && currency.symbol === 'BTC') return mockAssetFromExchange;
        if ('symbol' in currency && currency.symbol === 'ETH') return mockAssetTo;
        return null;
      },
    );

    vi.mocked(hasSupportForAsset).mockReturnValueOnce(false);
    expect(() => resolveAssets(dex, options)).toThrowError();
  });

  it('returns correct assets when destination is specified and supported', () => {
    const options = {
      from: undefined,
      to: 'CUSTOM_DEST',
      currencyFrom: { symbol: 'BTC' },
      currencyTo: { symbol: 'ETH' },
    } as unknown as TTransferOptions;

    const mockAssetFromExchange = { symbol: 'BTC_EXCHANGE' };
    const mockAssetTo = { symbol: 'ETH_EXCHANGE' };

    vi.mocked(getExchangeAsset).mockImplementation(
      (_exchangeNode: TExchangeNode, currency: TCurrencyInput) => {
        if ('symbol' in currency && currency.symbol === 'BTC') return mockAssetFromExchange;
        if ('symbol' in currency && currency.symbol === 'ETH') return mockAssetTo;
        return null;
      },
    );
    vi.mocked(hasSupportForAsset).mockReturnValueOnce(true);

    const result = resolveAssets(dex, options);
    expect(result).toEqual({
      assetFromOrigin: undefined,
      assetFromExchange: mockAssetFromExchange,
      assetTo: mockAssetTo,
    });
  });

  it('returns correct assets when both origin and destination are specified and valid', () => {
    const options = {
      from: 'CUSTOM_ORIGIN',
      to: 'CUSTOM_DEST',
      currencyFrom: { symbol: 'BTC' },
      currencyTo: { symbol: 'ETH' },
    } as unknown as TTransferOptions;

    const mockAssetFromOrigin = { symbol: 'BTC_ORIGIN' } as TAsset;
    const mockAssetFromExchange = { symbol: 'BTC_EXCHANGE' };
    const mockAssetTo = { symbol: 'ETH_EXCHANGE' };

    vi.mocked(findAsset).mockReturnValueOnce(mockAssetFromOrigin);
    vi.mocked(getExchangeAssetByOriginAsset).mockReturnValueOnce(mockAssetFromExchange);
    vi.mocked(getExchangeAsset).mockImplementation(
      (_exchangeNode: TExchangeNode, currency: TCurrencyInput) => {
        if ('symbol' in currency && currency.symbol === 'ETH') return mockAssetTo;
        return null;
      },
    );
    vi.mocked(hasSupportForAsset).mockReturnValueOnce(true);

    const result = resolveAssets(dex, options);
    expect(result).toEqual({
      assetFromOrigin: mockAssetFromOrigin,
      assetFromExchange: mockAssetFromExchange,
      assetTo: mockAssetTo,
    });
  });
});
