import type { Asset } from '@galacticcouncil/sdk-next';
import type { AssetClient } from '@galacticcouncil/sdk-next/client';
import type { TradeRouter } from '@galacticcouncil/sdk-next/sor';
import type { TxBuilderFactory } from '@galacticcouncil/sdk-next/tx';
import { getAssetDecimals, getNativeAssetSymbol } from '@paraspell/sdk-core';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { TPapiSwapOptions } from '../../../types';
import { calculateFee } from './calculateFee';
import { getAssetInfo } from './utils';

vi.mock('./utils', async () => {
  const actual = await vi.importActual('./utils');
  return {
    ...actual,
    getAssetInfo: vi.fn(),
  };
});

vi.mock('@paraspell/sdk-core', async (importOriginal) => ({
  ...(await importOriginal()),
  getAssetDecimals: vi.fn(),
  getNativeAssetSymbol: vi.fn(),
}));

describe('calculateFee', () => {
  let mockTxBuilderFactory: TxBuilderFactory;
  let mockAssetClient: AssetClient;

  beforeEach(() => {
    vi.resetAllMocks();

    const mockGetPaymentInfo = vi.fn().mockResolvedValue({ partial_fee: 10n });
    const mockGet = vi.fn().mockReturnValue({ getPaymentInfo: mockGetPaymentInfo });
    const mockBuild = vi.fn().mockResolvedValue({ get: mockGet });
    const mockWithBeneficiary = vi.fn().mockReturnValue({ build: mockBuild });
    const mockWithSlippage = vi.fn().mockReturnValue({ withBeneficiary: mockWithBeneficiary });
    const mockTrade = vi.fn().mockReturnValue({ withSlippage: mockWithSlippage });

    mockTxBuilderFactory = {
      trade: mockTrade,
    } as unknown as TxBuilderFactory;

    mockAssetClient = {
      getSupported: vi.fn(),
    } as unknown as AssetClient;

    vi.mocked(getAssetInfo).mockImplementation((_client, asset) => {
      if ('symbol' in asset && asset.symbol === 'HDX') {
        return Promise.resolve({ id: 9999, symbol: 'HDX' } as Asset);
      }
      if ('symbol' in asset && asset.symbol === 'BSX') {
        return Promise.resolve({ id: 8888, symbol: 'BSX' } as Asset);
      }
      return Promise.resolve(undefined);
    });

    vi.mocked(getAssetDecimals).mockReturnValue(12);
  });

  it('should throw if native currency info is not found', async () => {
    const mockTradeRouter = {
      getBestSell: vi.fn().mockResolvedValue({
        amountOut: 1000n,
      }),
      getSpotPrice: vi.fn().mockResolvedValue({ amount: 1n, decimals: 12 }),
    } as unknown as TradeRouter;

    const options = {
      amount: 1000n,
      slippagePct: '1',
      feeCalcAddress: 'someAddress',
    } as TPapiSwapOptions<unknown, unknown, unknown>;

    const currencyFromInfo = { id: 1, symbol: 'KSM' } as Asset;
    const currencyToInfo = { id: 2, symbol: 'DOT' } as Asset;

    vi.mocked(getAssetInfo).mockResolvedValue(undefined);

    await expect(
      calculateFee(
        options,
        mockTradeRouter,
        mockTxBuilderFactory,
        mockAssetClient,
        currencyFromInfo,
        currencyToInfo,
        12,
        'Hydration',
        1n,
      ),
    ).rejects.toThrow('Native currency not found');
  });

  it('should throw if native currency decimals are null', async () => {
    const options = {
      amount: 1000n,
      slippagePct: '1',
      feeCalcAddress: 'someAddress',
    } as TPapiSwapOptions<unknown, unknown, unknown>;

    const currencyFromInfo = { id: 1, symbol: 'FOO' } as Asset;
    const currencyToInfo = { id: 2, symbol: 'BAR' } as Asset;

    const mockTradeRouter = {
      getBestSell: vi.fn().mockResolvedValue({
        amountOut: 1000n,
      }),
      getSpotPrice: vi.fn().mockResolvedValue({ amount: 1n, decimals: 12 }),
    } as unknown as TradeRouter;

    vi.mocked(getAssetInfo).mockResolvedValue({
      symbol: 'HDX',
    } as Asset);

    vi.mocked(getAssetDecimals).mockReturnValue(null);

    await expect(
      calculateFee(
        options,
        mockTradeRouter,
        mockTxBuilderFactory,
        mockAssetClient,
        currencyFromInfo,
        currencyToInfo,
        12,
        'Hydration',
        1n,
      ),
    ).rejects.toThrow('Native currency decimals not found');
  });

  it('should throw if price is not found', async () => {
    vi.mocked(getNativeAssetSymbol).mockReturnValue('HDX');

    const mockTradeRouter = {
      getBestSell: vi.fn().mockResolvedValue({
        amountOut: 1000n,
      }),
      getSpotPrice: vi.fn().mockResolvedValue(undefined),
    } as unknown as TradeRouter;

    const options = {
      amount: 1000n,
      slippagePct: '1',
      feeCalcAddress: 'someAddress',
    } as TPapiSwapOptions<unknown, unknown, unknown>;

    const currencyFromInfo = { id: 1, symbol: 'BSX' } as Asset;
    const currencyToInfo = { id: 2, symbol: 'KSM' } as Asset;

    await expect(
      calculateFee(
        options,
        mockTradeRouter,
        mockTxBuilderFactory,
        mockAssetClient,
        currencyFromInfo,
        currencyToInfo,
        12,
        'Hydration',
        1n,
      ),
    ).rejects.toThrow('Price not found');
  });

  it('should return fee in native currency if currencyFrom is native currency', async () => {
    const options = {
      amount: 1000n,
      slippagePct: '1',
      feeCalcAddress: 'someAddress',
    } as TPapiSwapOptions<unknown, unknown, unknown>;

    const currencyFromInfo = { id: 9999, symbol: 'HDX' } as Asset;
    const currencyToInfo = { id: 2, symbol: 'KSM' } as Asset;

    vi.mocked(getNativeAssetSymbol).mockReturnValue('HDX');

    const mockTradeRouter = {
      getBestSell: vi.fn().mockResolvedValue({
        amountOut: 1000n,
      }),
      getSpotPrice: vi.fn().mockResolvedValue({
        amount: 1n,
        decimals: 12,
      }),
    } as unknown as TradeRouter;

    const result = await calculateFee(
      options,
      mockTradeRouter,
      mockTxBuilderFactory,
      mockAssetClient,
      currencyFromInfo,
      currencyToInfo,
      12,
      'Hydration',
      2n,
    );

    expect(result.toString()).toBe('14');
  });

  it('should return final fee in currencyFrom if currencyFrom is NOT the native currency', async () => {
    const options = {
      amount: 1000n,
      slippagePct: '1',
      feeCalcAddress: 'someAddress',
    } as TPapiSwapOptions<unknown, unknown, unknown>;
    const currencyFromInfo = { id: 1, symbol: 'KSM' } as Asset;
    const currencyToInfo = { id: 2, symbol: 'DOT' } as Asset;

    vi.mocked(getNativeAssetSymbol).mockReturnValue('HDX');

    const mockTradeRouter = {
      getBestSell: vi.fn().mockResolvedValue({
        amountOut: 1000n,
      }),
      getSpotPrice: vi.fn().mockResolvedValue({
        amount: 2n,
        decimals: 12,
      }),
    } as unknown as TradeRouter;

    const finalFeeBN = await calculateFee(
      options,
      mockTradeRouter,
      mockTxBuilderFactory,
      mockAssetClient,
      currencyFromInfo,
      currencyToInfo,
      12,
      'Hydration',
      2n,
    );
    expect(finalFeeBN.toString()).toBe('7700000000000');
  });
});
