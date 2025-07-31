import { getBalanceNative } from '@paraspell/sdk';
import type { ApiPromise } from '@polkadot/api';
import BigNumber from 'bignumber.js';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { SmallAmountError } from '../../errors/SmallAmountError';
import type { TSingleSwapResult, TSwapOptions } from '../../types';
import AcalaExchange from './AcalaExchange';
import { calculateAcalaSwapFee, createAcalaClient, getDexConfig } from './utils';

vi.mock('@paraspell/sdk', () => ({
  getBalanceNative: vi.fn().mockResolvedValue(100n),
  getNativeAssetSymbol: vi.fn().mockReturnValue('ACA'),
  getNativeAssets: vi.fn(),
  getOtherAssets: vi.fn(),
  findAssetById: vi.fn(),
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
      USDC: {
        symbol: 'USDC',
        toCurrencyId: vi.fn().mockReturnValue({
          toString: () =>
            JSON.stringify({
              Foreign: '',
            }),
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

vi.mock('./utils', () => ({
  createAcalaClient: vi.fn().mockResolvedValue({
    isMockApi: true,
  }),
  calculateAcalaSwapFee: vi.fn().mockReturnValue(BigNumber(1)),
  getDexConfig: vi.fn(),
}));

vi.mock('../../Logger/Logger', () => {
  return {
    default: {
      log: vi.fn(),
    },
  };
});

describe('AcalaExchange', () => {
  let chain: AcalaExchange;

  beforeEach(() => {
    chain = new AcalaExchange('Acala', 'AcalaDex');
  });

  describe('createApiInstance', () => {
    it('should create an Acala Api instance by calling createAcalaApiInstance', async () => {
      const api = await chain.createApiInstance();
      expect(createAcalaClient).toHaveBeenCalledWith('Acala');
      expect(api).toEqual({ isMockApi: true });
    });
  });

  describe('getAssets', () => {
    it('should call getDexConfig with the api and chain', async () => {
      const mockConfig = {
        isOmni: false,
        assets: [],
        pairs: [],
      };
      vi.mocked(getDexConfig).mockResolvedValue(mockConfig);
      const config = await chain.getDexConfig({} as ApiPromise);
      expect(getDexConfig).toHaveBeenCalledWith({}, chain.chain);
      expect(config).toEqual(mockConfig);
    });
  });

  describe('swapCurrency', () => {
    const mockApi = {} as ApiPromise;
    const baseSwapOptions = {
      assetFrom: { symbol: 'DOT' },
      assetTo: { symbol: 'ACA' },
      amount: '100',
    } as TSwapOptions;

    it('should throw SmallAmountError when amountWithoutFee is negative in swapCurrency', async () => {
      const mockApi = {} as ApiPromise;
      const options = {
        assetFrom: { symbol: 'DOT' },
        assetTo: { symbol: 'ACA' },
        amount: '1',
        senderAddress: 'some-address',
        origin: {},
      } as TSwapOptions;

      vi.mocked(getBalanceNative).mockResolvedValueOnce(0n);

      vi.mocked(calculateAcalaSwapFee).mockResolvedValueOnce(new BigNumber(1));

      await expect(chain.swapCurrency(mockApi, options, new BigNumber(1))).rejects.toThrow(
        SmallAmountError,
      );
    });

    it('should swap successfully and return the tx and modified amountOut', async () => {
      const result: TSingleSwapResult = await chain.swapCurrency(
        mockApi,
        baseSwapOptions,
        new BigNumber(0.01),
      );

      expect(calculateAcalaSwapFee).toHaveBeenCalled();
      expect(result).toHaveProperty('tx');
      expect(result).toHaveProperty('amountOut');
      expect(result.amountOut).toBe('46200000000000');
    });

    it('should throw SmallAmountError if the amount is too small to cover fees', async () => {
      vi.mocked(calculateAcalaSwapFee).mockResolvedValueOnce(new BigNumber(9999));

      await expect(
        chain.swapCurrency(mockApi, baseSwapOptions, new BigNumber(0.01)),
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
      const result = await chain.getAmountOut(mockApi, baseSwapOptions);
      expect(result).toBe(42n);
    });
  });
});
