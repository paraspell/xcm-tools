import type { Asset, TxBuilderFactory } from '@galacticcouncil/sdk';
import { BigNumber } from '@galacticcouncil/sdk';
import { TradeRouter } from '@galacticcouncil/sdk';
import { getAssetDecimals, getNativeAssetSymbol } from '@paraspell/sdk';
import type { Extrinsic } from '@paraspell/sdk-pjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { TSwapOptions } from '../../../types';
import { calculateTxFeePjs } from '../../../utils';
import { calculateFee } from './calculateFee';
import { getAssetInfo } from './utils';

vi.mock('@galacticcouncil/sdk', async () => {
  const actual = await vi.importActual('@galacticcouncil/sdk');
  return {
    ...actual,
    TradeRouter: vi.fn(),
  };
});

vi.mock('../../../utils', async () => {
  const actual = await vi.importActual('../../../utils');
  return {
    ...actual,
    calculateTxFeePjs: vi.fn(),
  };
});

vi.mock('./utils', async () => {
  const actual = await vi.importActual('./utils');
  return {
    ...actual,
    getAssetInfo: vi.fn(),
  };
});

vi.mock('@paraspell/sdk', async () => {
  const original = await vi.importActual('@paraspell/sdk');
  return {
    ...original,
    getAssetDecimals: vi.fn(),
    getNativeAssetSymbol: vi.fn(),
  };
});

describe('calculateFee', () => {
  let mockTxBuilderFactory: TxBuilderFactory;

  beforeEach(() => {
    vi.resetAllMocks();

    const mockGet = vi.fn().mockReturnValue('mockExtrinsic' as unknown as Extrinsic);
    const mockBuild = vi.fn().mockResolvedValue({ get: mockGet });
    const mockWithBeneficiary = vi.fn().mockReturnValue({ build: mockBuild });
    const mockWithSlippage = vi.fn().mockReturnValue({ withBeneficiary: mockWithBeneficiary });
    const mockTrade = vi.fn().mockReturnValue({ withSlippage: mockWithSlippage });

    mockTxBuilderFactory = {
      trade: mockTrade,
    } as unknown as TxBuilderFactory;

    const mockTradeResult = {
      amountOut: BigNumber('10000000000000000'),
    };

    vi.mocked(TradeRouter).mockImplementation(
      () =>
        ({
          getBestSell: vi.fn().mockResolvedValue(mockTradeResult),
          getBestSpotPrice: vi.fn().mockResolvedValue({ amount: BigNumber('1'), decimals: 12 }),
        }) as unknown as TradeRouter,
    );

    vi.mocked(calculateTxFeePjs).mockResolvedValue(10n);

    vi.mocked(getAssetInfo).mockImplementation((_router, asset) => {
      if ('symbol' in asset && asset.symbol === 'HDX') {
        return Promise.resolve({ id: '9999', symbol: 'HDX' } as Asset);
      }
      if ('symbol' in asset && asset.symbol === 'BSX') {
        return Promise.resolve({ id: '8888', symbol: 'BSX' } as Asset);
      }
      return Promise.resolve(undefined);
    });

    vi.mocked(getAssetDecimals).mockReturnValue(12);
  });

  it('should throw if native currency info is not found', async () => {
    const mockTradeRouter = {
      getBestSell: vi.fn().mockResolvedValue({
        amountOut: BigNumber('1000'),
      }),
      getBestSpotPrice: vi.fn().mockResolvedValue({ amount: BigNumber('1'), decimals: 12 }),
    } as unknown as TradeRouter;

    const options = {
      amount: 1000n,
      slippagePct: '1',
      feeCalcAddress: 'someAddress',
    } as TSwapOptions;

    const currencyFromInfo = { id: '1', symbol: 'KSM' } as Asset;
    const currencyToInfo = { id: '2', symbol: 'DOT' } as Asset;

    vi.mocked(getAssetInfo).mockResolvedValue(undefined);

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
    ).rejects.toThrow('Native currency not found');
  });

  it('should throw if native currency decimals are null', async () => {
    const options = {
      amount: 1000n,
      slippagePct: '1',
      feeCalcAddress: 'someAddress',
    } as TSwapOptions;

    const currencyFromInfo = { id: '1', symbol: 'FOO' } as Asset;
    const currencyToInfo = { id: '2', symbol: 'BAR' } as Asset;

    const mockTradeRouter = {
      getBestSell: vi.fn().mockResolvedValue({
        amountOut: BigNumber('1000'),
      }),
      getBestSpotPrice: vi.fn().mockResolvedValue({ amount: BigNumber('1'), decimals: 12 }),
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
        amountOut: BigNumber('1000'),
      }),
      getBestSpotPrice: vi.fn().mockResolvedValue(undefined),
    } as unknown as TradeRouter;

    const options = {
      amount: 1000n,
      slippagePct: '1',
      feeCalcAddress: 'someAddress',
    } as TSwapOptions;

    const currencyFromInfo = { id: '1', symbol: 'BSX' } as Asset;
    const currencyToInfo = { id: '2', symbol: 'KSM' } as Asset;

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
    } as TSwapOptions;

    const currencyFromInfo = { id: '9999', symbol: 'HDX' } as Asset;
    const currencyToInfo = { id: '2', symbol: 'KSM' } as Asset;

    vi.mocked(getNativeAssetSymbol).mockReturnValue('HDX');

    const mockTradeRouter = {
      getBestSell: vi.fn().mockResolvedValue({
        amountOut: BigNumber('1000'),
      }),
      getBestSpotPrice: vi.fn().mockResolvedValue({
        amount: BigNumber('1'),
        decimals: 12,
      }),
    } as unknown as TradeRouter;

    vi.mocked(calculateTxFeePjs).mockResolvedValue(10n);

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
    } as TSwapOptions;
    const currencyFromInfo = { id: '1', symbol: 'KSM' } as Asset;
    const currencyToInfo = { id: '2', symbol: 'DOT' } as Asset;

    vi.mocked(getNativeAssetSymbol).mockReturnValue('HDX');

    const mockTradeRouter = {
      getBestSell: vi.fn().mockResolvedValue({
        amountOut: BigNumber('1000'),
      }),
      getBestSpotPrice: vi.fn().mockResolvedValue({
        amount: BigNumber('2'),
        decimals: 12,
      }),
      getAllAssets: vi.fn(),
    } as unknown as TradeRouter;

    vi.mocked(calculateTxFeePjs).mockResolvedValue(10n);

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
});
