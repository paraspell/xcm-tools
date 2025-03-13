import * as sdkPjs from '@paraspell/sdk-pjs';
import { getAssetBySymbolOrId } from '@paraspell/sdk-pjs';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import * as assets from '../../assets';
import type ExchangeNode from '../../dexNodes/DexNode';
import { createDexNodeInstance } from '../../dexNodes/DexNodeFactory';
import type { TTransferOptions } from '../../types';
import { selectBestExchange } from '../selectBestExchange';
import { prepareTransformedOptions } from './prepareTransformedOptions';
import { determineFeeCalcAddress } from './utils';

vi.mock('../../dexNodes/DexNodeFactory', () => ({
  createDexNodeInstance: vi.fn(),
}));

vi.mock('../selectBestExchange', () => ({
  selectBestExchange: vi.fn(),
}));

vi.mock('./utils', () => ({
  determineFeeCalcAddress: vi.fn(),
}));

vi.mock('../../assets', () => ({
  getExchangeAssetByOriginAsset: vi.fn(),
  getExchangeAsset: vi.fn(),
}));

vi.mock('@paraspell/sdk-pjs', async (importOriginal) => {
  const mod = await importOriginal<typeof import('@paraspell/sdk-pjs')>();
  return {
    ...mod,
    hasSupportForAsset: vi.fn(),
    createApiInstanceForNode: vi.fn(),
    getAssetBySymbolOrId: vi.fn(),
  };
});

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

    const mockDexNode = {
      node: 'Acala',
      exchangeNode: 'AcalaDex',
      createApiInstance: vi.fn(),
    } as unknown as ExchangeNode;

    vi.mocked(selectBestExchange).mockResolvedValue(mockDexNode);

    await expect(prepareTransformedOptions(mockOptions)).rejects.toThrow();

    expect(selectBestExchange).toHaveBeenCalledWith(mockOptions);
  });

  test('throws error when origin asset is not found', async () => {
    const mockOptions = {
      from: 'Acala',
      to: 'Astar',
      currencyFrom: { symbol: 'ACA' },
      currencyTo: { symbol: 'ASTR' },
      exchange: 'AcalaDex',
    } as TTransferOptions;

    const mockDexNode = {
      node: 'Acala',
      exchangeNode: 'AcalaDex',
    } as ExchangeNode;

    vi.mocked(createDexNodeInstance).mockReturnValue(mockDexNode);
    vi.mocked(getAssetBySymbolOrId).mockReturnValue(null);

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

    const mockDexNode = {
      node: 'Acala',
      exchangeNode: 'AcalaDex',
    } as ExchangeNode;

    vi.mocked(createDexNodeInstance).mockReturnValue(mockDexNode);
    vi.mocked(getAssetBySymbolOrId).mockReturnValue({ symbol: 'ACA' } as sdkPjs.TAsset);
    vi.mocked(assets.getExchangeAssetByOriginAsset).mockReturnValue(undefined);

    await expect(prepareTransformedOptions(mockOptions)).rejects.toThrow(
      `Currency from ${JSON.stringify(mockOptions.currencyFrom)} not found in ${mockDexNode.exchangeNode}.`,
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

    const mockDexNode = {
      node: 'Acala',
      exchangeNode: 'AcalaDex',
    } as ExchangeNode;

    vi.mocked(createDexNodeInstance).mockReturnValue(mockDexNode);
    vi.mocked(getAssetBySymbolOrId).mockReturnValue({ symbol: 'ACA' } as sdkPjs.TAsset);
    vi.mocked(assets.getExchangeAssetByOriginAsset).mockReturnValue({ symbol: 'EXCHANGE_ACA' });
    vi.mocked(assets.getExchangeAsset).mockReturnValue(null);

    await expect(prepareTransformedOptions(mockOptions)).rejects.toThrow(
      `Currency to ${JSON.stringify(mockOptions.currencyTo)} not found in ${mockDexNode.exchangeNode}.`,
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

    const mockDexNode = {
      node: 'Acala',
      exchangeNode: 'AcalaDex',
    } as ExchangeNode;

    vi.mocked(createDexNodeInstance).mockReturnValue(mockDexNode);
    vi.mocked(getAssetBySymbolOrId).mockReturnValue({ symbol: 'ACA' } as sdkPjs.TAsset);
    vi.mocked(assets.getExchangeAssetByOriginAsset).mockReturnValue({ symbol: 'EXCHANGE_ACA' });
    vi.mocked(assets.getExchangeAsset).mockReturnValue({ symbol: 'ASTR' });
    vi.mocked(sdkPjs.hasSupportForAsset).mockReturnValue(false);

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

    const mockDexNode = {
      node: 'Acala',
      exchangeNode: 'AcalaDex',
      createApiInstance: vi.fn().mockResolvedValue({}),
    } as unknown as ExchangeNode;

    const mockOriginAsset = { symbol: 'ACA' } as sdkPjs.TAsset;
    const mockExchangeAssetFrom = { symbol: 'EXCHANGE_ACA' };
    const mockExchangeAssetTo = { symbol: 'ASTR' };

    vi.mocked(createDexNodeInstance).mockReturnValue(mockDexNode);
    vi.mocked(getAssetBySymbolOrId).mockReturnValue(mockOriginAsset);
    vi.mocked(assets.getExchangeAssetByOriginAsset).mockReturnValue(mockExchangeAssetFrom);
    vi.mocked(assets.getExchangeAsset).mockReturnValue(mockExchangeAssetTo);
    vi.mocked(sdkPjs.hasSupportForAsset).mockReturnValue(true);
    vi.mocked(sdkPjs.createApiInstanceForNode).mockResolvedValue({} as sdkPjs.TPjsApi);
    vi.mocked(determineFeeCalcAddress).mockReturnValue('feeCalcAddr');

    const result = await prepareTransformedOptions(mockOptions);

    expect(result.dex).toBe(mockDexNode);
    expect(result.options.origin).toEqual({
      api: expect.any(Object),
      node: mockOptions.from,
      assetFrom: mockOriginAsset,
    });
    expect(result.options.exchange).toEqual({
      api: expect.any(Object),
      baseNode: mockDexNode.node,
      exchangeNode: mockDexNode.exchangeNode,
      assetFrom: mockExchangeAssetFrom,
      assetTo: mockExchangeAssetTo,
    });
    expect(result.options.feeCalcAddress).toBe('feeCalcAddr');
  });
});
