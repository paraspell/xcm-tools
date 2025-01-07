import { describe, it, expect, vi, beforeEach } from 'vitest';
import BigNumber from 'bignumber.js';
import { calculateAcalaTransactionFee } from './calculateAcalaTransactionFee';
import type { AggregateDex } from '@acala-network/sdk-swap';
import type { Wallet } from '@acala-network/sdk';
import type { Token } from '@acala-network/sdk-core';
import type { TSwapOptions } from '../../../types';
import { firstValueFrom } from 'rxjs';
import { calculateTransactionFee } from '../../../utils/utils';
import { convertCurrency } from './utils';

vi.mock('./utils', () => ({
  convertCurrency: vi.fn(),
}));

vi.mock('../../../utils/utils', () => ({
  calculateTransactionFee: vi.fn(),
}));

vi.mock('rxjs', () => ({
  firstValueFrom: vi.fn(),
}));

vi.mock('../../../Logger/Logger', () => ({
  __esModule: true,
  default: {
    log: vi.fn(),
  },
}));

describe('calculateAcalaTransactionFee', () => {
  let dexMock: Partial<AggregateDex>;
  let walletMock: Partial<Wallet>;
  let tokenFromMock: Partial<Token>;
  let tokenToMock: Partial<Token>;
  let swapOptionsMock: Partial<TSwapOptions>;

  const extrinsicMock = { method: 'mockExtrinsicMethod' };

  beforeEach(() => {
    vi.clearAllMocks();

    dexMock = {
      swap: vi.fn().mockReturnValue({
        subscribe: () => {},
      }),
      getTradingTx: vi.fn().mockReturnValue(extrinsicMock),
    };

    walletMock = {
      consts: {
        runtimeChain: 'acala',
        nativeCurrency: 'ACA',
      },
      getToken: vi.fn().mockImplementation((symbol: string) => {
        return {
          decimals: symbol === 'ACA' ? 12 : 6,
        };
      }),
    };

    tokenFromMock = {
      symbol: 'DOT',
      decimals: 10,
    };

    tokenToMock = {
      symbol: 'ACA',
      decimals: 12,
    };

    swapOptionsMock = {
      amount: '10000000000',
      feeCalcAddress: 'some-address',
    };
  });

  it('calculates fee when tokenFrom is NOT the native currency', async () => {
    const swapResultMock = { result: 'mockSwapResult' };
    vi.mocked(firstValueFrom).mockResolvedValue(swapResultMock);

    vi.mocked(calculateTransactionFee).mockResolvedValue(new BigNumber('0.1'));

    vi.mocked(convertCurrency).mockResolvedValue(5);

    const toDestTransactionFee = new BigNumber('0.05');

    const result = await calculateAcalaTransactionFee(
      dexMock as AggregateDex,
      walletMock as Wallet,
      tokenFromMock as Token,
      tokenToMock as Token,
      swapOptionsMock as TSwapOptions,
      toDestTransactionFee,
    );

    expect(dexMock.swap).toHaveBeenCalledTimes(1);
    expect(firstValueFrom).toHaveBeenCalledTimes(1);
    expect(dexMock.getTradingTx).toHaveBeenCalledWith(swapResultMock);
    expect(calculateTransactionFee).toHaveBeenCalledWith(extrinsicMock, 'some-address');
    expect(convertCurrency).toHaveBeenCalledWith(walletMock, 'ACA', 'DOT', 0.00000000000015);
    expect(result.toString()).toEqual('75000000000');
  });

  it('calculates fee when tokenFrom IS the native currency', async () => {
    const tokenMock = {
      symbol: 'ACA',
      decimals: 12,
    };

    const swapResultMock = { result: 'mockSwapResult2' };
    vi.mocked(firstValueFrom).mockResolvedValue(swapResultMock);

    vi.mocked(calculateTransactionFee).mockResolvedValue(new BigNumber('0.1'));

    vi.mocked(convertCurrency).mockResolvedValue(9999);

    const toDestTransactionFee = new BigNumber('0.05');

    const result = await calculateAcalaTransactionFee(
      dexMock as AggregateDex,
      walletMock as Wallet,
      tokenMock as Token,
      tokenToMock as Token,
      swapOptionsMock as TSwapOptions,
      toDestTransactionFee,
    );

    expect(result.toString()).toBe('0.15');
    expect(convertCurrency).not.toHaveBeenCalled();
  });
});
