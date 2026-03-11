import {
  findAssetInfo,
  findAssetInfoOrThrow,
  hasSupportForAsset,
  type TAssetInfo,
} from '@paraspell/sdk';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { getExchangeAsset, getExchangeAssetByOriginAsset } from '../../assets';
import type ExchangeChain from '../../exchanges/ExchangeChain';
import type { TTransferOptions } from '../../types';
import { resolveAssets } from './resolveAssets';

vi.mock('@paraspell/sdk', async (importOriginal) => ({
  ...(await importOriginal()),
  findAssetInfo: vi.fn(),
  findAssetInfoOrThrow: vi.fn(),
  hasSupportForAsset: vi.fn(),
}));

vi.mock('../../assets');

const dex = {
  chain: 'CHAIN_A',
  exchangeChain: 'EXCHANGE_CHAIN_B',
} as unknown as ExchangeChain;

describe('resolveAssets', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockAssetFromExchange: TAssetInfo = {
    symbol: 'BTC_EXCHANGE',
    decimals: 8,
    location: { parents: 1, interior: 'Here' },
  };
  const mockAssetTo: TAssetInfo = {
    symbol: 'ETH_EXCHANGE',
    decimals: 8,
    location: { parents: 1, interior: 'Here' },
  };

  it('returns correct assets when origin is not specified', () => {
    const options = {
      currencyFrom: { symbol: 'BTC' },
      currencyTo: { symbol: 'ETH' },
    } as TTransferOptions;

    vi.mocked(getExchangeAsset).mockImplementation((_exchangeChain, currency) => {
      if ('symbol' in currency && currency.symbol === 'BTC') return mockAssetFromExchange;
      if ('symbol' in currency && currency.symbol === 'ETH') return mockAssetTo;
      return null;
    });

    const result = resolveAssets(dex, options);
    expect(result).toEqual({
      assetFromOrigin: undefined,
      assetFromExchange: mockAssetFromExchange,
      assetTo: mockAssetTo,
    });
  });

  it('returns correct assets when origin is specified and found', () => {
    const options = {
      from: 'Astar',
      currencyFrom: { symbol: 'BTC' },
      currencyTo: { symbol: 'ETH' },
    } as TTransferOptions;

    const mockAssetFromOrigin = { symbol: 'BTC_ORIGIN', decimals: 8 } as TAssetInfo;

    vi.mocked(findAssetInfo).mockReturnValueOnce(mockAssetFromOrigin);
    vi.mocked(getExchangeAssetByOriginAsset).mockReturnValueOnce(mockAssetFromExchange);
    vi.mocked(getExchangeAsset).mockImplementation((_exchangeChain, currency) => {
      if ('symbol' in currency && currency.symbol === 'ETH') return mockAssetTo;
      return null;
    });

    const result = resolveAssets(dex, options);
    expect(result).toEqual({
      assetFromOrigin: mockAssetFromOrigin,
      assetFromExchange: mockAssetFromExchange,
      assetTo: mockAssetTo,
    });
  });

  it('throws error when origin is specified but asset from origin is not found', () => {
    const options = {
      from: 'Astar',
      currencyFrom: { symbol: 'BTC' },
      currencyTo: { symbol: 'ETH' },
    } as TTransferOptions;

    vi.mocked(findAssetInfo).mockReturnValueOnce(null);
    expect(() => resolveAssets(dex, options)).toThrow();
  });

  it('throws error when asset from exchange is not found (origin specified)', () => {
    const options = {
      from: 'Astar',
      currencyFrom: { symbol: 'BTC' },
      currencyTo: { symbol: 'ETH' },
    } as TTransferOptions;

    const mockAssetFromOrigin = { symbol: 'BTC_ORIGIN' } as TAssetInfo;
    vi.mocked(findAssetInfo).mockReturnValueOnce(mockAssetFromOrigin);
    vi.mocked(getExchangeAssetByOriginAsset).mockReturnValueOnce(undefined);

    expect(() => resolveAssets(dex, options)).toThrow();
  });

  it('throws error when asset from exchange is not found (non-origin specified)', () => {
    const options = {
      currencyFrom: { symbol: 'BTC' },
      currencyTo: { symbol: 'ETH' },
    } as TTransferOptions;

    vi.mocked(getExchangeAsset).mockImplementation((_exchangeChain, currency) => {
      if ('symbol' in currency && currency.symbol === 'BTC') return null;
      if ('symbol' in currency && currency.symbol === 'ETH')
        return {
          symbol: 'ETH_EXCHANGE',
          decimals: 8,
          location: { parents: 1, interior: 'Here' },
        };
      return null;
    });

    expect(() => resolveAssets(dex, options)).toThrow();
  });

  it('throws not swappable error when origin not specified and asset exists in SDK but not on exchange', () => {
    const options = {
      currencyFrom: { symbol: 'BTC' },
      currencyTo: { symbol: 'ETH' },
    } as TTransferOptions;

    vi.mocked(getExchangeAsset).mockImplementation((_exchangeChain, currency) => {
      if ('symbol' in currency && currency.symbol === 'BTC') return null;
      if ('symbol' in currency && currency.symbol === 'ETH') return mockAssetTo;
      return null;
    });

    const asset: TAssetInfo = {
      symbol: 'BTC',
      decimals: 8,
      location: { parents: 1, interior: 'Here' },
    };

    vi.mocked(findAssetInfo).mockReturnValueOnce(asset);

    expect(() => resolveAssets(dex, options)).toThrow('is not swappable');
  });

  it('throws error when destination specified and asset to is not supported', () => {
    const options = {
      to: 'Acala',
      currencyFrom: { symbol: 'BTC' },
      currencyTo: { symbol: 'ETH' },
    } as TTransferOptions;

    vi.mocked(getExchangeAsset).mockImplementation((_exchangeChain, currency) => {
      if ('symbol' in currency && currency.symbol === 'BTC') return mockAssetFromExchange;
      if ('symbol' in currency && currency.symbol === 'ETH') return mockAssetTo;
      return null;
    });

    vi.mocked(hasSupportForAsset).mockReturnValueOnce(false);
    expect(() => resolveAssets(dex, options)).toThrow();
  });

  it('returns correct assets when destination is specified and supported', () => {
    const options = {
      to: 'Acala',
      currencyFrom: { symbol: 'BTC' },
      currencyTo: { symbol: 'ETH' },
    } as TTransferOptions;

    vi.mocked(getExchangeAsset).mockImplementation((_exchangeChain, currency) => {
      if ('symbol' in currency && currency.symbol === 'BTC') return mockAssetFromExchange;
      if ('symbol' in currency && currency.symbol === 'ETH') return mockAssetTo;
      return null;
    });
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
      from: 'Astar',
      to: 'Acala',
      currencyFrom: { symbol: 'BTC' },
      currencyTo: { symbol: 'ETH' },
    } as TTransferOptions;

    const mockAssetFromOrigin = { symbol: 'BTC_ORIGIN', decimals: 8 } as TAssetInfo;

    vi.mocked(findAssetInfo).mockReturnValueOnce(mockAssetFromOrigin);
    vi.mocked(getExchangeAssetByOriginAsset).mockReturnValueOnce(mockAssetFromExchange);
    vi.mocked(getExchangeAsset).mockImplementation((_exchangeChain, currency) => {
      if ('symbol' in currency && currency.symbol === 'ETH') return mockAssetTo;
      return null;
    });
    vi.mocked(hasSupportForAsset).mockReturnValueOnce(true);

    const result = resolveAssets(dex, options);
    expect(result).toEqual({
      assetFromOrigin: mockAssetFromOrigin,
      assetFromExchange: mockAssetFromExchange,
      assetTo: mockAssetTo,
    });
  });

  it('throws error when feeAsset resolves but is not a valid fee asset', () => {
    const feeLocation = { parents: 1, interior: { X1: { PalletInstance: 50 } } };

    const options = {
      currencyFrom: { symbol: 'BTC' },
      currencyTo: { symbol: 'ETH' },
      feeAsset: { symbol: 'USDT' },
    } as TTransferOptions;

    vi.mocked(getExchangeAsset).mockImplementation((_exchangeChain, currency) => {
      if ('symbol' in currency && currency.symbol === 'BTC') return mockAssetFromExchange;
      if ('symbol' in currency && currency.symbol === 'ETH') return mockAssetTo;
      if ('symbol' in currency && currency.symbol === 'USDT')
        return { symbol: 'USDT', decimals: 6, location: feeLocation } as TAssetInfo;
      return null;
    });

    vi.mocked(findAssetInfoOrThrow).mockReturnValue({
      symbol: 'USDT',
      decimals: 6,
      location: feeLocation,
      isFeeAsset: false,
    } as TAssetInfo);

    expect(() => resolveAssets(dex, options)).toThrow('is not a valid fee asset');
  });
});
