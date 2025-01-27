import { describe, test, expect, beforeEach, vi } from 'vitest';
import { findAssetFrom, findAssetTo } from '../../assets/assets';
import { createDexNodeInstance } from '../../dexNodes/DexNodeFactory';
import { selectBestExchange } from '../selectBestExchange';
import { determineFeeCalcAddress } from './utils';
import { prepareTransformedOptions } from './prepareTransformedOptions';
import type ExchangeNode from '../../dexNodes/DexNode';
import type { TTransferOptions, TRouterEvent } from '../../types';

vi.mock('../../assets/assets', () => ({
  findAssetFrom: vi.fn(),
  findAssetTo: vi.fn(),
}));

vi.mock('../../dexNodes/DexNodeFactory', () => ({
  createDexNodeInstance: vi.fn(),
}));

vi.mock('../../utils/utils', () => ({
  maybeUpdateTransferStatus: vi.fn(),
}));

vi.mock('../selectBestExchange', () => ({
  selectBestExchange: vi.fn(),
}));

vi.mock('./utils', () => ({
  determineFeeCalcAddress: vi.fn(),
}));

describe('prepareTransformedOptions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('calls maybeUpdateTransferStatus when onStatusChange is provided (initial call)', async () => {
    const mockOnStatusChange = vi.fn() as (info: TRouterEvent) => void;

    const mockExchange = 'AcalaDex';
    vi.mocked(createDexNodeInstance).mockReturnValue({
      exchangeNode: 'AcalaDex',
      node: 'Acala',
    } as ExchangeNode);

    await prepareTransformedOptions({
      onStatusChange: mockOnStatusChange,
      exchange: mockExchange,
      from: 'Acala',
      to: 'Astar',
      currencyFrom: { symbol: 'ABC' },
      currencyTo: { symbol: 'XYZ' },
    } as TTransferOptions);
  });

  test('calls selectBestExchange if exchange is undefined', async () => {
    const mockOnStatusChange = vi.fn() as (info: TRouterEvent) => void;
    vi.mocked(selectBestExchange).mockResolvedValue({
      exchangeNode: 'AcalaDex',
      node: 'Acala',
    } as ExchangeNode);

    await prepareTransformedOptions({
      onStatusChange: mockOnStatusChange,
      from: 'Acala',
      to: 'Astar',
      currencyFrom: { symbol: 'ABC' },
      currencyTo: { symbol: 'XYZ' },
    } as TTransferOptions);

    expect(selectBestExchange).toHaveBeenCalledTimes(1);
  });

  test('throws error when assetFrom is not found and currencyFrom has id', async () => {
    vi.mocked(createDexNodeInstance).mockReturnValue({
      exchangeNode: 'AcalaDex',
      node: 'Acala',
    } as ExchangeNode);

    vi.mocked(findAssetFrom).mockReturnValue(undefined);

    await expect(
      prepareTransformedOptions({
        from: 'Acala',
        to: 'Astar',
        currencyFrom: { id: 'ABC' },
        currencyTo: { symbol: 'XYZ' },
      } as TTransferOptions),
    ).rejects.toThrow();
  });

  test('throws error when assetTo is not found and currencyTo has id', async () => {
    vi.mocked(createDexNodeInstance).mockReturnValue({
      exchangeNode: 'AcalaDex',
      node: 'Acala',
    } as ExchangeNode);

    vi.mocked(findAssetFrom).mockReturnValue({ symbol: 'ABC' });
    vi.mocked(findAssetTo).mockReturnValue(undefined);

    await expect(
      prepareTransformedOptions({
        from: 'Acala',
        to: 'Astar',
        currencyFrom: { symbol: 'ABC' },
        currencyTo: { id: 'xyz' },
        exchange: 'AcalaDex',
      } as TTransferOptions),
    ).rejects.toThrow();
  });

  test('returns correct object when assets are found', async () => {
    vi.mocked(createDexNodeInstance).mockReturnValue({
      exchangeNode: 'AcalaDex',
      node: 'Acala',
    } as ExchangeNode);

    vi.mocked(findAssetFrom).mockReturnValue({ symbol: 'ABC' });
    vi.mocked(findAssetTo).mockReturnValue({ symbol: 'XYZ' });

    vi.mocked(determineFeeCalcAddress).mockReturnValue('calculatedFeeAddress');

    const mockOptions = {
      from: 'Acala',
      to: 'Astar',
      currencyFrom: { symbol: 'ABC' },
      currencyTo: { symbol: 'XYZ' },
      injectorAddress: '0x123',
      recipientAddress: '0x456',
      exchange: 'AcalaDex',
    } as TTransferOptions;

    const result = await prepareTransformedOptions(mockOptions);

    expect(result).toHaveProperty('dex');
    expect(result).toHaveProperty('options');

    expect(result.dex).toStrictEqual({
      exchangeNode: 'AcalaDex',
      node: 'Acala',
    });

    expect(result.options).toMatchObject({
      ...mockOptions,
      exchangeNode: 'Acala',
      exchange: 'AcalaDex',
      assetFrom: { symbol: 'ABC' },
      assetTo: { symbol: 'XYZ' },
      feeCalcAddress: 'calculatedFeeAddress',
    });
  });
});
