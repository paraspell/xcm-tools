import { describe, it, expect, vi, beforeEach } from 'vitest';
import BigNumber from 'bignumber.js';
import type { ApiPromise } from '@polkadot/api';
import { SmallAmountError } from '../../errors/SmallAmountError';
import type { TSwapOptions, TSwapResult } from '../../types';
import { createAcalaApiInstance, calculateAcalaSwapFee } from './utils';
import AcalaExchangeNode from './AcalaDex';

vi.mock('@paraspell/sdk-pjs', () => ({
  getBalanceNative: vi.fn().mockResolvedValue(new BigNumber(100)),
  getNativeAssetSymbol: vi.fn().mockReturnValue('ACA'),
}));

vi.mock('@acala-network/sdk-core', () => ({
  FixedPointNumber: vi.fn().mockImplementation((value: string) => ({
    toString: () => value,
  })),
}));

vi.mock('@acala-network/sdk', () => ({
  Wallet: vi.fn().mockImplementation(() => ({
    isReady: Promise.resolve(),
    getToken: vi.fn().mockImplementation((symbol: string) => ({
      symbol,
      decimals: symbol === 'ACA' ? 12 : 10,
    })),
    getPrice: vi.fn().mockImplementation((symbol: string) => ({
      toNumber: () => (symbol.includes('0price') ? 0 : 1),
    })),
    getTokens: vi.fn().mockResolvedValue({
      ACA: {
        symbol: 'ACA',
        toCurrencyId: vi.fn().mockReturnValue({
          toString: () => JSON.stringify({ Token: 'ACA' }),
        }),
      },
      DOT: {
        symbol: 'DOT',
        toCurrencyId: vi.fn().mockReturnValue({
          toString: () => JSON.stringify({ Token: 'DOT' }),
        }),
      },
    }),
    consts: {
      nativeCurrency: 'ACA',
    },
  })),
}));

vi.mock('@acala-network/sdk-swap', () => ({
  AcalaDex: vi.fn(),
  AggregateDex: vi.fn().mockImplementation(() => ({
    swap: vi.fn().mockImplementation(() => ({
      subscribe: vi.fn(),
    })),
    getTradingTx: vi.fn().mockImplementation(() => ({})),
  })),
}));

vi.mock('rxjs', async () => {
  const actual = await vi.importActual('rxjs');
  return {
    ...actual,
    firstValueFrom: vi.fn().mockResolvedValue({
      result: {
        output: {
          amount: '42',
        },
      },
    }),
  };
});

vi.mock('./utils', () => {
  return {
    createAcalaApiInstance: vi.fn().mockResolvedValue({
      isMockApi: true,
    }),
    calculateAcalaSwapFee: vi.fn().mockImplementation(() => {
      return new BigNumber(1);
    }),
  };
});

vi.mock('../../Logger/Logger', () => {
  return {
    default: {
      log: vi.fn(),
    },
  };
});

describe('AcalaExchangeNode', () => {
  let node: AcalaExchangeNode;

  beforeEach(() => {
    node = new AcalaExchangeNode('Acala', 'AcalaDex');
    vi.clearAllMocks();
  });

  describe('createApiInstance', () => {
    it('should create an Acala Api instance by calling createAcalaApiInstance', async () => {
      const api = await node.createApiInstance();
      expect(createAcalaApiInstance).toHaveBeenCalledWith('Acala');
      expect(api).toEqual({ isMockApi: true });
    });
  });

  describe('getAssets', () => {
    it('should return a list of assets from the wallet', async () => {
      const mockApi = {} as ApiPromise;
      const assets = await node.getAssets(mockApi);

      expect(assets).toEqual([{ symbol: 'ACA' }, { symbol: 'DOT' }]);
    });
  });

  describe('swapCurrency', () => {
    const mockApi = {} as ApiPromise;
    const baseSwapOptions = {
      assetFrom: { symbol: 'DOT' },
      assetTo: { symbol: 'ACA' },
      amount: '100',
    } as TSwapOptions;

    it('should swap successfully and return the tx and modified amountOut', async () => {
      const result: TSwapResult = await node.swapCurrency(
        mockApi,
        baseSwapOptions,
        new BigNumber(0.01),
        { proofSize: BigNumber(0), refTime: BigNumber(0) },
      );

      expect(calculateAcalaSwapFee).toHaveBeenCalled();
      expect(result).toHaveProperty('tx');
      expect(result).toHaveProperty('amountOut');
      expect(result.amountOut).toBe('46200000000000');
    });

    it('should throw SmallAmountError if the amount is too small to cover fees', async () => {
      vi.mocked(calculateAcalaSwapFee).mockResolvedValueOnce(new BigNumber(9999));

      await expect(
        node.swapCurrency(mockApi, baseSwapOptions, new BigNumber(0.01), {
          proofSize: BigNumber(0),
          refTime: BigNumber(0),
        }),
      ).rejects.toThrow(SmallAmountError);
    });
  });

  describe('getAmountOut', () => {
    const mockApi = {} as ApiPromise;
    const baseSwapOptions = {
      assetFrom: { symbol: 'DOT' },
      assetTo: { symbol: 'ACA' },
      amount: '100',
    } as TSwapOptions;

    it('should return the amountOut with fee deducted', async () => {
      const result = await node.getAmountOut(mockApi, baseSwapOptions);

      expect(result).toBe(42n);
    });
  });
});
