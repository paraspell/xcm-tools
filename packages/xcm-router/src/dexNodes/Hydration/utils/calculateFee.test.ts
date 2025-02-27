import { beforeEach, describe, expect, it, vi } from 'vitest';
import BigNumber from 'bignumber.js';
import { calculateTxFee } from '../../../utils';
import type { Asset } from '@galacticcouncil/sdk';
import { TradeRouter } from '@galacticcouncil/sdk';
import { getAssetDecimals, getNativeAssetSymbol, type Extrinsic } from '@paraspell/sdk-pjs';
import type { TSwapOptions } from '../../../types';
import { calculateFee } from './calculateFee';
import { getAssetInfo } from './utils';

vi.mock('@galacticcouncil/sdk', () => ({
  TradeRouter: vi.fn().mockImplementation(() => ({
    getAllAssets: vi.fn(),
    getBestSell: vi.fn(),
    getBestSpotPrice: vi.fn(),
  })),
  bnum: vi.fn(),
}));

vi.mock('../../../utils', () => ({
  calculateTxFee: vi.fn(),
}));

vi.mock('./utils', async () => {
  const actual = await vi.importActual('./utils');
  return {
    ...actual,
    getAssetInfo: vi.fn(),
  };
});

vi.mock('@paraspell/sdk-pjs', () => ({
  getAssetDecimals: vi.fn(),
  getNativeAssetSymbol: vi.fn(),
}));

describe('calculateFee', () => {
  beforeEach(() => {
    vi.resetAllMocks();

    const mockToTxGet = vi.fn().mockResolvedValue('mockExtrinsic' as unknown as Extrinsic);
    const mockTrade = {
      amountOut: new BigNumber('10000000000000000'),
      toTx: vi.fn().mockReturnValue({ get: mockToTxGet }),
    };

    vi.mocked(TradeRouter).mockImplementation(
      () =>
        ({
          getBestSell: vi.fn().mockResolvedValue(mockTrade),
          getBestSpotPrice: vi.fn().mockResolvedValue({ amount: new BigNumber('1'), decimals: 12 }),
        }) as unknown as TradeRouter,
    );

    vi.mocked(calculateTxFee).mockResolvedValue(BigNumber(10));

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
        amountOut: new BigNumber('1000'),
        toTx: () => ({ get: vi.fn().mockReturnValue({} as Extrinsic) }),
      }),
      getBestSpotPrice: vi.fn().mockResolvedValue({ amount: new BigNumber('1'), decimals: 12 }),
    } as unknown as TradeRouter;

    const options = {
      amount: '1000',
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
        currencyFromInfo,
        currencyToInfo,
        12,
        12,
        'Hydration',
        BigNumber('1'),
      ),
    ).rejects.toThrow('Native currency not found');
  });

  it('should throw if native currency decimals are null', async () => {
    const options = {
      amount: '1000',
      slippagePct: '1',
      feeCalcAddress: 'someAddress',
    } as TSwapOptions;

    const currencyFromInfo = { id: '1', symbol: 'FOO' } as Asset;
    const currencyToInfo = { id: '2', symbol: 'BAR' } as Asset;

    const mockTradeRouter = {
      getBestSell: vi.fn().mockResolvedValue({
        amountOut: new BigNumber('1000'),
        toTx: () => ({ get: vi.fn().mockReturnValue({} as Extrinsic) }),
      }),
      getBestSpotPrice: vi.fn().mockResolvedValue({ amount: new BigNumber('1'), decimals: 12 }),
    } as unknown as TradeRouter;

    vi.mocked(getAssetInfo).mockResolvedValue({
      symbol: 'HDX',
    } as Asset);

    vi.mocked(getAssetDecimals).mockReturnValue(null);

    await expect(
      calculateFee(
        options,
        mockTradeRouter,
        currencyFromInfo,
        currencyToInfo,
        12,
        12,
        'Hydration',
        BigNumber(1),
      ),
    ).rejects.toThrow('Native currency decimals not found');
  });

  it('should throw if price is not found', async () => {
    vi.mocked(getNativeAssetSymbol).mockReturnValue('HDX');

    const mockTradeRouter = {
      getBestSell: vi.fn().mockResolvedValue({
        amountOut: new BigNumber('1000'),
        toTx: () => ({ get: vi.fn().mockReturnValue({} as Extrinsic) }),
      }),
      getBestSpotPrice: vi.fn().mockResolvedValue(undefined),
    } as unknown as TradeRouter;

    const options = {
      amount: '1000',
      slippagePct: '1',
      feeCalcAddress: 'someAddress',
    } as TSwapOptions;

    const currencyFromInfo = { id: '1', symbol: 'BSX' } as Asset;
    const currencyToInfo = { id: '2', symbol: 'KSM' } as Asset;

    await expect(
      calculateFee(
        options,
        mockTradeRouter,
        currencyFromInfo,
        currencyToInfo,
        12,
        12,
        'Hydration',
        BigNumber(1),
      ),
    ).rejects.toThrow('Price not found');
  });

  it('should return fee in native currency if currencyFrom is native currency', async () => {
    const options = {
      amount: '1000',
      slippagePct: '1',
      feeCalcAddress: 'someAddress',
    } as TSwapOptions;

    const currencyFromInfo = { id: '9999', symbol: 'HDX' } as Asset;
    const currencyToInfo = { id: '2', symbol: 'KSM' } as Asset;

    vi.mocked(getNativeAssetSymbol).mockReturnValue('HDX');

    const mockTradeRouter = {
      getBestSell: vi.fn().mockResolvedValue({
        amountOut: new BigNumber('1000'),
        toTx: () => ({ get: vi.fn().mockReturnValue({} as Extrinsic) }),
      }),
      getBestSpotPrice: vi.fn().mockResolvedValue({
        amount: new BigNumber('1'),
        decimals: 12,
      }),
    } as unknown as TradeRouter;

    vi.mocked(calculateTxFee).mockResolvedValue(BigNumber(10));

    const result = await calculateFee(
      options,
      mockTradeRouter,
      currencyFromInfo,
      currencyToInfo,
      12,
      12,
      'Hydration',
      BigNumber(2),
    );

    expect(result.toString()).toBe('14');
  });

  it('should return final fee in currencyFrom if currencyFrom is NOT the native currency', async () => {
    const options = {
      amount: '1000',
      slippagePct: '1',
      feeCalcAddress: 'someAddress',
    } as TSwapOptions;
    const currencyFromInfo = { id: '1', symbol: 'KSM' } as Asset;
    const currencyToInfo = { id: '2', symbol: 'DOT' } as Asset;

    vi.mocked(getNativeAssetSymbol).mockReturnValue('HDX');

    const mockTradeRouter = {
      getBestSell: vi.fn().mockResolvedValue({
        amountOut: new BigNumber('1000'),
        toTx: () => ({ get: vi.fn().mockReturnValue({} as Extrinsic) }),
      }),
      getBestSpotPrice: vi.fn().mockResolvedValue({
        amount: new BigNumber('2'),
        decimals: 12,
      }),
      getAllAssets: vi.fn(),
    } as unknown as TradeRouter;

    vi.mocked(calculateTxFee).mockResolvedValue(BigNumber(10));

    const finalFeeBN = await calculateFee(
      options,
      mockTradeRouter,
      currencyFromInfo,
      currencyToInfo,
      12,
      12,
      'Hydration',
      BigNumber(2),
    );
    expect(finalFeeBN.toString()).toBe('7700000000000');
  });
});
