import type { TAssetInfo } from '@paraspell/sdk-core';
import type { PolkadotApi } from '@paraspell/sdk-core';
import { createChainClient, findAssetInfo, hasSupportForAsset } from '@paraspell/sdk-core';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import {
  getExchangeAsset,
  getExchangeAssetByOriginAsset,
  supportsExchangePair,
} from '../../assets';
import type ExchangeChain from '../../exchanges/ExchangeChain';
import { createExchangeInstance } from '../../exchanges/ExchangeChainFactory';
import type { TTransferBaseOptions } from '../../types';
import { selectBestExchange } from '../selectBestExchange';
import { prepareTransformedOptions } from './prepareTransformedOptions';
import { determineFeeCalcAddress } from './utils';

const mockApiForChain = { api: {} };
const mockApi = {
  createApiForChain: vi.fn().mockResolvedValue(mockApiForChain),
  config: undefined,
} as unknown as PolkadotApi<unknown, unknown, unknown>;

vi.mock('../../exchanges/ExchangeChainFactory');
vi.mock('../selectBestExchange');
vi.mock('./utils');
vi.mock('../../assets');

vi.mock('@paraspell/sdk-core', async (importActual) => ({
  ...(await importActual()),
  hasSupportForAsset: vi.fn(),
  createChainClient: vi.fn(),
  findAssetInfo: vi.fn(),
  applyDecimalAbstraction: vi.fn(),
}));

describe('prepareTransformedOptions', () => {
  const acaAsset: TAssetInfo = {
    symbol: 'ACA',
    decimals: 8,
    location: {
      parents: 1,
      interior: 'Here',
    },
  };

  const astrAsset: TAssetInfo = {
    symbol: 'ASTR',
    decimals: 8,
    location: {
      parents: 2,
      interior: 'Here',
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('calls selectBestExchange if exchange is undefined', async () => {
    const mockOptions = {
      from: 'Acala',
      to: 'Astar',
      currencyFrom: { symbol: 'ACA' },
      currencyTo: { symbol: 'ASTR' },
    } as TTransferBaseOptions<unknown, unknown, unknown>;

    const mockDexChain = {
      chain: 'Acala',
      exchangeChain: 'AcalaDex',
      createApiInstance: vi.fn(),
      createApiInstancePapi: vi.fn(),
    } as unknown as ExchangeChain;

    vi.mocked(selectBestExchange).mockResolvedValue(mockDexChain);
    vi.mocked(supportsExchangePair).mockReturnValue(true);

    await expect(prepareTransformedOptions({ ...mockOptions, api: mockApi })).rejects.toThrow();

    expect(selectBestExchange).toHaveBeenCalledWith({ ...mockOptions, api: mockApi }, {}, false);
  });

  test('throws error when origin asset is not found', async () => {
    const mockOptions = {
      from: 'Acala',
      to: 'Astar',
      currencyFrom: { symbol: 'ACA' },
      currencyTo: { symbol: 'ASTR' },
      exchange: 'AcalaDex',
    } as TTransferBaseOptions<unknown, unknown, unknown>;

    const mockDexChain = {
      chain: 'Acala',
      exchangeChain: 'AcalaDex',
    } as ExchangeChain;

    vi.mocked(createExchangeInstance).mockReturnValue(mockDexChain);
    vi.mocked(findAssetInfo).mockReturnValue(null);
    vi.mocked(supportsExchangePair).mockReturnValue(true);

    await expect(prepareTransformedOptions({ ...mockOptions, api: mockApi })).rejects.toThrow(
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
    } as TTransferBaseOptions<unknown, unknown, unknown>;

    const mockDexChain = {
      chain: 'Acala',
      exchangeChain: 'AcalaDex',
    } as ExchangeChain;

    vi.mocked(createExchangeInstance).mockReturnValue(mockDexChain);
    vi.mocked(findAssetInfo).mockReturnValue(null);
    vi.mocked(getExchangeAssetByOriginAsset).mockReturnValue(undefined);
    vi.mocked(supportsExchangePair).mockReturnValue(true);

    await expect(prepareTransformedOptions({ ...mockOptions, api: mockApi })).rejects.toThrow(
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
    } as TTransferBaseOptions<unknown, unknown, unknown>;

    const mockDexChain = {
      chain: 'Acala',
      exchangeChain: 'AcalaDex',
    } as ExchangeChain;

    vi.mocked(createExchangeInstance).mockReturnValue(mockDexChain);
    vi.mocked(findAssetInfo).mockReturnValue({ symbol: 'ACA' } as TAssetInfo);
    vi.mocked(getExchangeAssetByOriginAsset).mockReturnValue(acaAsset);
    vi.mocked(getExchangeAsset).mockReturnValue(null);
    vi.mocked(supportsExchangePair).mockReturnValue(true);

    await expect(prepareTransformedOptions({ ...mockOptions, api: mockApi })).rejects.toThrow(
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
    } as TTransferBaseOptions<unknown, unknown, unknown>;

    const mockDexChain = {
      chain: 'Acala',
      exchangeChain: 'AcalaDex',
    } as ExchangeChain;

    vi.mocked(createExchangeInstance).mockReturnValue(mockDexChain);
    vi.mocked(findAssetInfo).mockReturnValue({ symbol: 'ACA' } as TAssetInfo);
    vi.mocked(getExchangeAssetByOriginAsset).mockReturnValue(acaAsset);
    vi.mocked(getExchangeAsset).mockReturnValue(astrAsset);
    vi.mocked(hasSupportForAsset).mockReturnValue(false);
    vi.mocked(supportsExchangePair).mockReturnValue(true);

    await expect(prepareTransformedOptions({ ...mockOptions, api: mockApi })).rejects.toThrow(
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
      sender: 'senderAddr',
      recipient: 'recipientAddr',
    } as TTransferBaseOptions<unknown, unknown, unknown>;

    const mockDexChain = {
      chain: 'Acala',
      exchangeChain: 'AcalaDex',
      createApiInstance: vi.fn().mockResolvedValue({}),
      createApiInstancePapi: vi.fn().mockResolvedValue({}),
    } as unknown as ExchangeChain;

    const mockOriginAsset = { symbol: 'ACA', decimals: 8 } as TAssetInfo;

    vi.mocked(createExchangeInstance).mockReturnValue(mockDexChain);
    vi.mocked(findAssetInfo).mockReturnValue(mockOriginAsset);
    vi.mocked(getExchangeAssetByOriginAsset).mockReturnValue(acaAsset);
    vi.mocked(getExchangeAsset).mockReturnValue(astrAsset);
    vi.mocked(hasSupportForAsset).mockReturnValue(true);
    vi.mocked(createChainClient).mockResolvedValue({});
    vi.mocked(supportsExchangePair).mockReturnValue(true);
    vi.mocked(determineFeeCalcAddress).mockReturnValue('feeCalcAddr');

    const result = await prepareTransformedOptions({ ...mockOptions, api: mockApi });

    expect(result.dex).toBe(mockDexChain);
    expect(result.options.origin).toEqual({
      api: expect.any(Object),
      chain: mockOptions.from,
      assetFrom: mockOriginAsset,
    });
    expect(result.options.exchange).toEqual({
      apiPjs: expect.any(Object),
      apiPapi: expect.any(Object),
      api: expect.anything(),
      baseChain: mockDexChain.chain,
      exchangeChain: mockDexChain.exchangeChain,
      assetFrom: acaAsset,
      assetTo: astrAsset,
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
    } as TTransferBaseOptions<unknown, unknown, unknown>;

    const mockDexChain = {
      chain: 'Acala',
      exchangeChain: 'AcalaDex',
    } as ExchangeChain;

    vi.mocked(createExchangeInstance).mockReturnValue(mockDexChain);
    vi.mocked(findAssetInfo).mockReturnValue(acaAsset);
    vi.mocked(getExchangeAssetByOriginAsset).mockReturnValue(acaAsset);
    vi.mocked(getExchangeAsset).mockReturnValue(astrAsset);
    vi.mocked(hasSupportForAsset).mockReturnValue(true);
    vi.mocked(supportsExchangePair).mockReturnValue(false);

    await expect(prepareTransformedOptions({ ...mockOptions, api: mockApi })).rejects.toThrow(
      `Exchange ${mockDexChain.chain} does not support the pair ASTR -> ASTR`,
    );
  });
});
