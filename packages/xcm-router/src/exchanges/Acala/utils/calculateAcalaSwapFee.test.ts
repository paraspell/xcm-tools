import type { Wallet } from '@acala-network/sdk';
import type { Token } from '@acala-network/sdk-core';
import type { AggregateDex } from '@acala-network/sdk-swap';
import BigNumber from 'bignumber.js';
import { firstValueFrom } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { TSwapOptions } from '../../../types';
import { calculateTxFeePjs } from '../../../utils';
import { calculateAcalaSwapFee } from './calculateAcalaSwapFee';

vi.mock('./utils', () => ({
  convertCurrency: vi.fn(),
}));

vi.mock('../../../utils', () => ({
  calculateTxFeePjs: vi.fn(),
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

    vi.mocked(calculateTxFeePjs).mockResolvedValue(new BigNumber('0.1'));

    const result = await calculateAcalaSwapFee(
      dexMock as AggregateDex,
      walletMock as Wallet,
      tokenFromMock as Token,
      tokenToMock as Token,
      swapOptionsMock as TSwapOptions,
    );

    expect(dexMock.swap).toHaveBeenCalledTimes(1);
    expect(firstValueFrom).toHaveBeenCalledTimes(1);
    expect(dexMock.getTradingTx).toHaveBeenCalledWith(swapResultMock);
    expect(calculateTxFeePjs).toHaveBeenCalledWith(extrinsicMock, 'some-address');
    expect(result.toString()).toEqual('0.1');
  });

  it('calculates fee when tokenFrom IS the native currency', async () => {
    const tokenMock = {
      symbol: 'ACA',
      decimals: 12,
    };

    const swapResultMock = { result: 'mockSwapResult2' };
    vi.mocked(firstValueFrom).mockResolvedValue(swapResultMock);

    vi.mocked(calculateTxFeePjs).mockResolvedValue(new BigNumber('0.1'));

    const result = await calculateAcalaSwapFee(
      dexMock as AggregateDex,
      walletMock as Wallet,
      tokenMock as Token,
      tokenToMock as Token,
      swapOptionsMock as TSwapOptions,
    );

    expect(result.toString()).toBe('0.1');
  });
});
