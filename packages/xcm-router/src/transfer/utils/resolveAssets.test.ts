import {
  findAssetInfo,
  hasSupportForAsset,
  type TAssetInfo,
  type TCurrencyInput,
} from '@paraspell/sdk';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { getExchangeAsset, getExchangeAssetByOriginAsset } from '../../assets';
import type ExchangeChain from '../../exchanges/ExchangeChain';
import type { TExchangeChain, TTransferOptions } from '../../types';
import { resolveAssets } from './resolveAssets';

vi.mock('@paraspell/sdk');

vi.mock('../../assets');

const dex = {
  chain: 'CHAIN_A',
  exchangeChain: 'EXCHANGE_CHAIN_B',
} as unknown as ExchangeChain;

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

    const mockAssetFromExchange = { symbol: 'BTC_EXCHANGE', decimals: 8 };
    const mockAssetTo = { symbol: 'ETH_EXCHANGE', decimals: 8 };

    vi.mocked(getExchangeAsset).mockImplementation(
      (_exchangeChain: TExchangeChain, currency: TCurrencyInput) => {
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
      from: 'CUSTOM_CHAIN',
      to: undefined,
      currencyFrom: { symbol: 'BTC' },
      currencyTo: { symbol: 'ETH' },
    } as unknown as TTransferOptions;

    const mockAssetFromOrigin = { symbol: 'BTC_ORIGIN', decimals: 8 } as TAssetInfo;
    const mockAssetFromExchange = { symbol: 'BTC_EXCHANGE', decimals: 8 };
    const mockAssetTo = { symbol: 'ETH_EXCHANGE', decimals: 8 };

    vi.mocked(findAssetInfo).mockReturnValueOnce(mockAssetFromOrigin);
    vi.mocked(getExchangeAssetByOriginAsset).mockReturnValueOnce(mockAssetFromExchange);
    vi.mocked(getExchangeAsset).mockImplementation(
      (_exchangeChain: TExchangeChain, currency: TCurrencyInput) => {
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
      from: 'CUSTOM_CHAIN',
      to: undefined,
      currencyFrom: { symbol: 'BTC' },
      currencyTo: { symbol: 'ETH' },
    } as unknown as TTransferOptions;

    vi.mocked(findAssetInfo).mockReturnValueOnce(null);
    expect(() => resolveAssets(dex, options)).toThrow();
  });

  it('throws error when asset from exchange is not found (origin specified)', () => {
    const options = {
      from: 'CUSTOM_CHAIN',
      to: undefined,
      currencyFrom: { symbol: 'BTC' },
      currencyTo: { symbol: 'ETH' },
    } as unknown as TTransferOptions;

    const mockAssetFromOrigin = { symbol: 'BTC_ORIGIN' } as TAssetInfo;
    vi.mocked(findAssetInfo).mockReturnValueOnce(mockAssetFromOrigin);
    vi.mocked(getExchangeAssetByOriginAsset).mockReturnValueOnce(undefined);

    expect(() => resolveAssets(dex, options)).toThrow();
  });

  it('throws error when asset from exchange is not found (non-origin specified)', () => {
    const options = {
      from: undefined,
      to: undefined,
      currencyFrom: { symbol: 'BTC' },
      currencyTo: { symbol: 'ETH' },
    } as unknown as TTransferOptions;

    vi.mocked(getExchangeAsset).mockImplementation(
      (_exchangeChain: TExchangeChain, currency: TCurrencyInput) => {
        if ('symbol' in currency && currency.symbol === 'BTC') return null;
        if ('symbol' in currency && currency.symbol === 'ETH')
          return { symbol: 'ETH_EXCHANGE', decimals: 8 };
        return null;
      },
    );

    expect(() => resolveAssets(dex, options)).toThrow();
  });

  it('throws error when destination specified and asset to is not supported', () => {
    const options = {
      from: undefined,
      to: 'CUSTOM_DEST',
      currencyFrom: { symbol: 'BTC' },
      currencyTo: { symbol: 'ETH' },
    } as unknown as TTransferOptions;

    const mockAssetFromExchange = { symbol: 'BTC_EXCHANGE', decimals: 8 };
    const mockAssetTo = { symbol: 'ETH_EXCHANGE', decimals: 8 };

    vi.mocked(getExchangeAsset).mockImplementation(
      (_exchangeChain: TExchangeChain, currency: TCurrencyInput) => {
        if ('symbol' in currency && currency.symbol === 'BTC') return mockAssetFromExchange;
        if ('symbol' in currency && currency.symbol === 'ETH') return mockAssetTo;
        return null;
      },
    );

    vi.mocked(hasSupportForAsset).mockReturnValueOnce(false);
    expect(() => resolveAssets(dex, options)).toThrow();
  });

  it('returns correct assets when destination is specified and supported', () => {
    const options = {
      from: undefined,
      to: 'CUSTOM_DEST',
      currencyFrom: { symbol: 'BTC' },
      currencyTo: { symbol: 'ETH' },
    } as unknown as TTransferOptions;

    const mockAssetFromExchange = { symbol: 'BTC_EXCHANGE', decimals: 8 };
    const mockAssetTo = { symbol: 'ETH_EXCHANGE', decimals: 8 };

    vi.mocked(getExchangeAsset).mockImplementation(
      (_exchangeChain: TExchangeChain, currency: TCurrencyInput) => {
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

    const mockAssetFromOrigin = { symbol: 'BTC_ORIGIN', decimals: 8 } as TAssetInfo;
    const mockAssetFromExchange = { symbol: 'BTC_EXCHANGE', decimals: 8 };
    const mockAssetTo = { symbol: 'ETH_EXCHANGE', decimals: 8 };

    vi.mocked(findAssetInfo).mockReturnValueOnce(mockAssetFromOrigin);
    vi.mocked(getExchangeAssetByOriginAsset).mockReturnValueOnce(mockAssetFromExchange);
    vi.mocked(getExchangeAsset).mockImplementation(
      (_exchangeChain: TExchangeChain, currency: TCurrencyInput) => {
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
