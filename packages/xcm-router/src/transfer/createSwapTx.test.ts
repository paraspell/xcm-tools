import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { ApiPromise } from '@polkadot/api';
import type { Extrinsic } from '@paraspell/sdk-pjs';
import type ExchangeNode from '../dexNodes/DexNode';
import type { TTransferOptionsModified } from '../types';

import { createSwapTx } from './createSwapTx';
import { buildFromExchangeExtrinsic, buildToExchangeExtrinsic } from './utils';
import { calculateTransactionFee } from '../utils/utils';
import BigNumber from 'bignumber.js';

vi.mock('./utils', () => ({
  buildFromExchangeExtrinsic: vi.fn(),
  buildToExchangeExtrinsic: vi.fn(),
}));

vi.mock('../utils/utils', () => ({
  calculateTransactionFee: vi.fn(),
}));

describe('createSwapTx', () => {
  const originApi = {} as ApiPromise;
  const swapApi = {} as ApiPromise;
  let exchangeNode: ExchangeNode;
  let options: TTransferOptionsModified;
  let dummyExtrinsic: Extrinsic;

  beforeEach(() => {
    vi.clearAllMocks();

    exchangeNode = {
      swapCurrency: vi.fn(),
    } as unknown as ExchangeNode;

    options = {
      amount: '1000',
      feeCalcAddress: 'someFeeCalcAddress',
    } as TTransferOptionsModified;

    dummyExtrinsic = { method: { toHex: () => '0x123' } } as unknown as Extrinsic;

    vi.mocked(buildFromExchangeExtrinsic).mockResolvedValue(dummyExtrinsic);
    vi.mocked(buildToExchangeExtrinsic).mockResolvedValue(dummyExtrinsic);
    vi.mocked(calculateTransactionFee).mockResolvedValue(BigNumber(10));
    vi.spyOn(exchangeNode, 'swapCurrency').mockResolvedValue({
      amountOut: '900',
      tx: dummyExtrinsic,
    });
  });

  it('should build extrinsics, calculate fees, and call swapCurrency', async () => {
    const spy = vi.spyOn(exchangeNode, 'swapCurrency');

    const result = await createSwapTx(originApi, swapApi, exchangeNode, options);

    expect(buildFromExchangeExtrinsic).toHaveBeenCalledOnce();
    expect(buildFromExchangeExtrinsic).toHaveBeenCalledWith(swapApi, options, '1000');

    expect(buildToExchangeExtrinsic).toHaveBeenCalledOnce();
    expect(buildToExchangeExtrinsic).toHaveBeenCalledWith(originApi, options);

    expect(calculateTransactionFee).toHaveBeenCalledTimes(2);
    expect(calculateTransactionFee).toHaveBeenNthCalledWith(
      1,
      dummyExtrinsic,
      'someFeeCalcAddress',
    );
    expect(calculateTransactionFee).toHaveBeenNthCalledWith(
      2,
      dummyExtrinsic,
      'someFeeCalcAddress',
    );

    expect(spy).toHaveBeenCalledOnce();
    expect(spy).toHaveBeenCalledWith(swapApi, options, BigNumber(10), BigNumber(10));

    expect(result).toEqual({
      amountOut: '900',
      tx: dummyExtrinsic,
    });
  });

  it('should propagate errors if buildFromExchangeExtrinsic fails', async () => {
    vi.mocked(buildFromExchangeExtrinsic).mockRejectedValue(
      new Error('buildFromExchangeExtrinsic failed'),
    );

    await expect(createSwapTx(originApi, swapApi, exchangeNode, options)).rejects.toThrowError(
      'buildFromExchangeExtrinsic failed',
    );
  });

  it('should propagate errors if swapCurrency fails', async () => {
    vi.spyOn(exchangeNode, 'swapCurrency').mockRejectedValue(new Error('swapCurrency failed'));

    await expect(createSwapTx(originApi, swapApi, exchangeNode, options)).rejects.toThrowError(
      'swapCurrency failed',
    );
  });
});
