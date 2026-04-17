import { AmountTooLowError, getBalance, getNativeAssetSymbol } from '@paraspell/sdk-core';
import type { ApiPromise } from '@polkadot/api';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { TSwapOptions } from '../../types';
import AcalaExchange from './AcalaExchange';
import { calculateAcalaSwapFee, createAcalaClient, getDexConfig } from './utils';

vi.mock('@paraspell/sdk-core', async (importOriginal) => ({
  ...(await importOriginal()),
  getNativeAssetSymbol: vi.fn(),
  getBalance: vi.fn(),
}));

vi.mock('@acala-network/sdk-core', () => ({
  FixedPointNumber: vi.fn(
    class {
      constructor(private value: number) {
        this.value = value;
      }

      toString = () => this.value;
    },
  ),
}));

vi.mock('@acala-network/sdk', () => ({
  Wallet: vi.fn(
    class {
      isReady = Promise.resolve();
      getToken = vi.fn().mockImplementation((symbol: string) => ({
        symbol,
        decimals: symbol === 'ACA' ? 12 : 10,
      }));
      getPrice = vi.fn().mockImplementation((symbol: string) => ({
        toNumber: () => (symbol.includes('0price') ? 0 : 1),
      }));
      getTokens = vi.fn().mockResolvedValue({
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
      });
      consts = {
        nativeCurrency: 'ACA',
      };
    },
  ),
}));

vi.mock('@acala-network/sdk-swap', () => ({
  AcalaDex: vi.fn(),
  AggregateDex: vi.fn(
    class {
      swap = vi.fn().mockImplementation(() => ({
        subscribe: vi.fn(),
      }));
      getTradingTx = vi.fn().mockImplementation(() => ({}));
    },
  ),
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
  calculateAcalaSwapFee: vi.fn().mockReturnValue(1n),
  getDexConfig: vi.fn(),
}));

vi.mock('../../Logger/Logger');

describe('AcalaExchange', () => {
  let chain: AcalaExchange;

  beforeEach(() => {
    chain = new AcalaExchange('Acala');
    vi.mocked(getBalance).mockResolvedValue(100n);
    vi.mocked(getNativeAssetSymbol).mockReturnValue('ACA');
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
      apiPjs: mockApi,
      assetFrom: { symbol: 'DOT' },
      assetTo: { symbol: 'ACA' },
      amount: 100n,
    } as TSwapOptions<unknown, unknown, unknown>;

    it('throws AmountTooLowError when amount is negative (amountWithoutFee < 0)', async () => {
      vi.mocked(getBalance).mockResolvedValueOnce(1_000_000n);
      vi.mocked(calculateAcalaSwapFee).mockResolvedValueOnce(0n);

      await expect(
        chain.swapCurrency(
          {
            apiPjs: mockApi,
            assetFrom: { symbol: 'DOT' },
            assetTo: { symbol: 'ACA' },
            amount: -1n,
            sender: '5xxxx',
            origin: {},
          } as TSwapOptions<unknown, unknown, unknown>,
          0n,
        ),
      ).rejects.toThrow(AmountTooLowError);
    });

    it('should throw AmountTooLowError when amountWithoutFee is negative in swapCurrency', async () => {
      const mockApi = {} as ApiPromise;
      const options = {
        apiPjs: mockApi,
        assetFrom: { symbol: 'DOT' },
        assetTo: { symbol: 'ACA' },
        amount: 1n,
        sender: 'some-address',
        origin: {},
      } as TSwapOptions<unknown, unknown, unknown>;

      vi.mocked(getBalance).mockResolvedValueOnce(0n);
      vi.mocked(calculateAcalaSwapFee).mockResolvedValueOnce(1n);

      await expect(chain.swapCurrency(options, 1n)).rejects.toThrow(AmountTooLowError);
    });

    it('should swap successfully and return the tx and modified amountOut', async () => {
      const result = await chain.swapCurrency(baseSwapOptions, 1n);

      expect(calculateAcalaSwapFee).toHaveBeenCalled();
      expect(result).toHaveProperty('tx');
      expect(result).toHaveProperty('amountOut');
      expect(result.amountOut).toBe(46199999999998n);
    });

    it('should throw AmountTooLowError if the amount is too small to cover fees', async () => {
      vi.mocked(calculateAcalaSwapFee).mockResolvedValueOnce(9999n);

      await expect(chain.swapCurrency(baseSwapOptions, 1n)).rejects.toThrow(AmountTooLowError);
    });
  });

  describe('getAmountOut', () => {
    const mockApi = {} as ApiPromise;
    const baseSwapOptions = {
      apiPjs: mockApi,
      assetFrom: { symbol: 'DOT' },
      assetTo: { symbol: 'ACA' },
      amount: 100n,
    } as TSwapOptions<unknown, unknown, unknown>;

    it('should return the amountOut with fee deducted', async () => {
      const result = await chain.getAmountOut(baseSwapOptions);
      expect(result).toBe(42000000000000n);
    });
  });
});
