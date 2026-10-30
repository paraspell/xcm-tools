import type { Asset } from '@galacticcouncil/sdk-next';
import type { TradeRouter } from '@galacticcouncil/sdk-next/sor';
import type { TxBuilderFactory } from '@galacticcouncil/sdk-next/tx';
import { findNativeAssetInfoOrThrow, type TAssetInfo } from '@paraspell/sdk-core';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { TPapiSwapOptions } from '../../../types';
import { calculateFee } from './calculateFee';

vi.mock('@paraspell/sdk-core', { spy: true });

describe('calculateFee', () => {
  let mockTxBuilderFactory: TxBuilderFactory;

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

    vi.mocked(findNativeAssetInfoOrThrow).mockReturnValue({
      symbol: 'HDX',
      decimals: 12,
      assetId: '0',
    } as TAssetInfo);
  });

  it('should throw if native asset info is not found', async () => {
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

    vi.mocked(findNativeAssetInfoOrThrow).mockImplementation(() => {
      throw new Error('Native asset not found');
    });

    await expect(
      calculateFee(
        options,
        mockTradeRouter,
        mockTxBuilderFactory,
        currencyFromInfo,
        currencyToInfo,
        12,
        'Hydration',
        1n,
      ),
    ).rejects.toThrow('Native asset not found');
  });

  it('should throw if price is not found', async () => {
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
      currencyFromInfo,
      currencyToInfo,
      12,
      'Hydration',
      2n,
    );
    expect(finalFeeBN.toString()).toBe('7700000000000');
  });

  it('should quote the fee trade with the amount in decimal units', async () => {
    const options = {
      amount: 1_500_000_000_000n,
      slippagePct: '1',
      feeCalcAddress: 'someAddress',
    } as TPapiSwapOptions<unknown, unknown, unknown>;
    const currencyFromInfo = { id: 0, symbol: 'HDX' } as Asset;
    const currencyToInfo = { id: 2, symbol: 'DOT' } as Asset;

    const getBestSell = vi.fn().mockResolvedValue({
      amountOut: 1000n,
    });
    const mockTradeRouter = { getBestSell } as unknown as TradeRouter;

    await calculateFee(
      options,
      mockTradeRouter,
      mockTxBuilderFactory,
      currencyFromInfo,
      currencyToInfo,
      12,
      'Hydration',
      2n,
    );

    expect(getBestSell).toHaveBeenCalledWith(0, 2, '1.5');
  });
});
