import * as sdkPapi from '@paraspell/sdk';
import { findAssetInfo } from '@paraspell/sdk';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import * as assets from '../../assets';
import type ExchangeChain from '../../exchanges/ExchangeChain';
import { createExchangeInstance } from '../../exchanges/ExchangeChainFactory';
import type { TTransferOptions } from '../../types';
import { selectBestExchange } from '../selectBestExchange';
import { prepareTransformedOptions } from './prepareTransformedOptions';
import { determineFeeCalcAddress } from './utils';

vi.mock('../../exchanges/ExchangeChainFactory');
vi.mock('../selectBestExchange');
vi.mock('./utils');
vi.mock('../../assets');

vi.mock('@paraspell/sdk', async (importActual) => ({
  ...(await importActual()),
  hasSupportForAsset: vi.fn(),
  createChainClient: vi.fn(),
  findAssetInfo: vi.fn(),
  applyDecimalAbstraction: vi.fn(),
}));

describe('prepareTransformedOptions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('calls selectBestExchange if exchange is undefined', async () => {
    const mockOptions = {
      from: 'Acala',
      to: 'Astar',
      currencyFrom: { symbol: 'ACA' },
      currencyTo: { symbol: 'ASTR' },
    } as TTransferOptions;

    const mockDexChain = {
      chain: 'Acala',
      exchangeChain: 'AcalaDex',
      createApiInstance: vi.fn(),
      createApiInstancePapi: vi.fn(),
    } as unknown as ExchangeChain;

    vi.mocked(selectBestExchange).mockResolvedValue(mockDexChain);
    vi.mocked(assets.supportsExchangePair).mockReturnValue(true);

    await expect(prepareTransformedOptions(mockOptions)).rejects.toThrow();

    expect(selectBestExchange).toHaveBeenCalledWith(mockOptions, undefined, undefined, false);
  });

  test('throws error when origin asset is not found', async () => {
    const mockOptions = {
      from: 'Acala',
      to: 'Astar',
      currencyFrom: { symbol: 'ACA' },
      currencyTo: { symbol: 'ASTR' },
      exchange: 'AcalaDex',
    } as TTransferOptions;

    const mockDexChain = {
      chain: 'Acala',
      exchangeChain: 'AcalaDex',
    } as ExchangeChain;

    vi.mocked(createExchangeInstance).mockReturnValue(mockDexChain);
    vi.mocked(findAssetInfo).mockReturnValue(null);
    vi.mocked(assets.supportsExchangePair).mockReturnValue(true);

    await expect(prepareTransformedOptions(mockOptions)).rejects.toThrow(
      `Currency from ${JSON.stringify(mockOptions.currencyFrom)} not found in ${mockOptions.exchange?.toString()}.`,
    );
  });

  test('throws error when exchange assetFrom is not found', async () => {
    const mockOptions = {
      from: 'Acala',
      to: 'Astar',
      currencyFrom: { symbol: 'ACA' },
      currencyTo: { symbol: 'ASTR' },
      exchange: 'AcalaDex',
    } as TTransferOptions;

    const mockDexChain = {
      chain: 'Acala',
      exchangeChain: 'AcalaDex',
    } as ExchangeChain;

    vi.mocked(createExchangeInstance).mockReturnValue(mockDexChain);
    vi.mocked(findAssetInfo).mockReturnValue({ symbol: 'ACA' } as sdkPapi.TAssetInfo);
    vi.mocked(assets.getExchangeAssetByOriginAsset).mockReturnValue(undefined);
    vi.mocked(assets.supportsExchangePair).mockReturnValue(true);

    await expect(prepareTransformedOptions(mockOptions)).rejects.toThrow(
      `Currency from ${JSON.stringify(mockOptions.currencyFrom)} not found in ${mockDexChain.exchangeChain}.`,
    );
  });

  test('throws error when exchange assetTo is not found', async () => {
    const mockOptions = {
      from: 'Hydration',
      to: 'Astar',
      currencyFrom: { symbol: 'ACA' },
      currencyTo: { symbol: 'ASTR' },
      exchange: 'AcalaDex',
    } as TTransferOptions;

    const mockDexChain = {
      chain: 'Acala',
      exchangeChain: 'AcalaDex',
    } as ExchangeChain;

    vi.mocked(createExchangeInstance).mockReturnValue(mockDexChain);
    vi.mocked(findAssetInfo).mockReturnValue({ symbol: 'ACA' } as sdkPapi.TAssetInfo);
    vi.mocked(assets.getExchangeAssetByOriginAsset).mockReturnValue({
      symbol: 'EXCHANGE_ACA',
      decimals: 8,
    });
    vi.mocked(assets.getExchangeAsset).mockReturnValue(null);
    vi.mocked(assets.supportsExchangePair).mockReturnValue(true);

    await expect(prepareTransformedOptions(mockOptions)).rejects.toThrow(
      `Currency to ${JSON.stringify(mockOptions.currencyTo)} not found in ${mockDexChain.exchangeChain}.`,
    );
  });

  test('throws error when destination does not support assetTo', async () => {
    const mockOptions = {
      from: 'Acala',
      to: 'Astar',
      currencyFrom: { symbol: 'ACA' },
      currencyTo: { symbol: 'ASTR' },
      exchange: 'AcalaDex',
    } as TTransferOptions;

    const mockDexChain = {
      chain: 'Acala',
      exchangeChain: 'AcalaDex',
    } as ExchangeChain;

    vi.mocked(createExchangeInstance).mockReturnValue(mockDexChain);
    vi.mocked(findAssetInfo).mockReturnValue({ symbol: 'ACA' } as sdkPapi.TAssetInfo);
    vi.mocked(assets.getExchangeAssetByOriginAsset).mockReturnValue({
      symbol: 'EXCHANGE_ACA',
      decimals: 8,
    });
    vi.mocked(assets.getExchangeAsset).mockReturnValue({ symbol: 'ASTR', decimals: 8 });
    vi.mocked(sdkPapi.hasSupportForAsset).mockReturnValue(false);
    vi.mocked(assets.supportsExchangePair).mockReturnValue(true);

    await expect(prepareTransformedOptions(mockOptions)).rejects.toThrow(
      `Currency to ${JSON.stringify(mockOptions.currencyTo)} not supported by ${mockOptions.to}.`,
    );
  });

  test('returns correctly transformed options when all assets are found', async () => {
    const mockOptions = {
      from: 'Hydration',
      to: 'Astar',
      currencyFrom: { symbol: 'ACA' },
      currencyTo: { symbol: 'ASTR' },
      exchange: 'AcalaDex',
      senderAddress: 'senderAddr',
      recipientAddress: 'recipientAddr',
    } as TTransferOptions;

    const mockDexChain = {
      chain: 'Acala',
      exchangeChain: 'AcalaDex',
      createApiInstance: vi.fn().mockResolvedValue({}),
      createApiInstancePapi: vi.fn().mockResolvedValue({}),
    } as unknown as ExchangeChain;

    const mockOriginAsset = { symbol: 'ACA', decimals: 8 } as sdkPapi.TAssetInfo;
    const mockExchangeAssetFrom = { symbol: 'EXCHANGE_ACA', decimals: 8 };
    const mockExchangeAssetTo = { symbol: 'ASTR', decimals: 8 };

    vi.mocked(createExchangeInstance).mockReturnValue(mockDexChain);
    vi.mocked(findAssetInfo).mockReturnValue(mockOriginAsset);
    vi.mocked(assets.getExchangeAssetByOriginAsset).mockReturnValue(mockExchangeAssetFrom);
    vi.mocked(assets.getExchangeAsset).mockReturnValue(mockExchangeAssetTo);
    vi.mocked(sdkPapi.hasSupportForAsset).mockReturnValue(true);
    vi.mocked(sdkPapi.createChainClient).mockResolvedValue({} as sdkPapi.TPapiApi);
    vi.mocked(determineFeeCalcAddress).mockReturnValue('feeCalcAddr');

    const result = await prepareTransformedOptions(mockOptions);

    expect(result.dex).toBe(mockDexChain);
    expect(result.options.origin).toEqual({
      api: expect.any(Object),
      chain: mockOptions.from,
      assetFrom: mockOriginAsset,
    });
    expect(result.options.exchange).toEqual({
      api: expect.any(Object),
      apiPapi: expect.any(Object),
      baseChain: mockDexChain.chain,
      exchangeChain: mockDexChain.exchangeChain,
      assetFrom: mockExchangeAssetFrom,
      assetTo: mockExchangeAssetTo,
    });
    expect(result.options.feeCalcAddress).toBe('feeCalcAddr');
  });

  test('throws error when exchange does not support the asset pair', async () => {
    const mockOptions = {
      from: 'Acala',
      to: 'Astar',
      currencyFrom: { symbol: 'ACA' },
      currencyTo: { symbol: 'ASTR' },
      exchange: 'AcalaDex',
    } as TTransferOptions;

    const mockDexChain = {
      chain: 'Acala',
      exchangeChain: 'AcalaDex',
    } as ExchangeChain;

    vi.mocked(createExchangeInstance).mockReturnValue(mockDexChain);
    vi.mocked(findAssetInfo).mockReturnValue({ symbol: 'ACA', decimals: 8 } as sdkPapi.TAssetInfo);
    vi.mocked(assets.getExchangeAssetByOriginAsset).mockReturnValue({
      symbol: 'EXCHANGE_ACA',
      decimals: 8,
    });
    vi.mocked(assets.getExchangeAsset).mockReturnValue({ symbol: 'ASTR', decimals: 8 });
    vi.mocked(sdkPapi.hasSupportForAsset).mockReturnValue(true);
    vi.mocked(assets.supportsExchangePair).mockReturnValue(false);

    await expect(prepareTransformedOptions(mockOptions)).rejects.toThrow(
      `Exchange ${mockDexChain.chain} does not support the pair ASTR -> ASTR`,
    );
  });
});
