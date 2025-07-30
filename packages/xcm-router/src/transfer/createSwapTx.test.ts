import type { TPapiTransaction } from '@paraspell/sdk';
import { type Extrinsic } from '@paraspell/sdk-pjs';
import type { ApiPromise } from '@polkadot/api';
import BigNumber from 'bignumber.js';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type ExchangeChain from '../exchanges/ExchangeChain';
import type { TTransferOptionsModified } from '../types';
import { calculateTxFee, isPjsExtrinsic } from '../utils';
import { createSwapTx } from './createSwapTx';
import { buildFromExchangeExtrinsic, convertTxToPapi } from './utils';

vi.mock('./utils', () => ({
  buildFromExchangeExtrinsic: vi.fn(),
  convertTxToPapi: vi.fn(),
}));

vi.mock('../utils', () => ({
  calculateTxFee: vi.fn(),
  getTxWeight: vi.fn(),
  isPjsExtrinsic: vi.fn(),
}));

describe('createSwapTx', () => {
  const swapApi = {} as ApiPromise;
  let exchangeChain: ExchangeChain;
  let options: TTransferOptionsModified;
  let dummyExtrinsic: Extrinsic;
  let dummyTxPapi: TPapiTransaction;

  beforeEach(() => {
    vi.resetAllMocks();

    exchangeChain = {
      swapCurrency: vi.fn(),
      handleMultiSwap: vi.fn(),
    } as unknown as ExchangeChain;

    options = {
      amount: '1000',
      feeCalcAddress: 'someFeeCalcAddress',
      exchange: {
        api: swapApi,
      },
      origin: {
        chain: 'Acala',
      },
      to: 'Astar',
      destination: {
        chain: 'Astar',
      },
    } as TTransferOptionsModified;

    dummyExtrinsic = { method: { toHex: () => '0x123' } } as unknown as Extrinsic;
    dummyTxPapi = {
      method: {
        toHex: () => '0x123',
      },
    } as unknown as TPapiTransaction;

    vi.mocked(buildFromExchangeExtrinsic).mockResolvedValue(dummyTxPapi);
    vi.mocked(calculateTxFee).mockResolvedValue(BigNumber(10));
    vi.spyOn(exchangeChain, 'handleMultiSwap').mockResolvedValue({
      amountOut: '900',
      txs: [dummyExtrinsic],
    });

    vi.mocked(convertTxToPapi).mockResolvedValue(dummyTxPapi);
    vi.mocked(isPjsExtrinsic).mockReturnValue(true);
  });

  it('should build extrinsics, calculate fees, and call swapCurrency', async () => {
    const spy = vi.spyOn(exchangeChain, 'handleMultiSwap');

    const result = await createSwapTx(exchangeChain, options);

    expect(buildFromExchangeExtrinsic).toHaveBeenCalledOnce();
    expect(buildFromExchangeExtrinsic).toHaveBeenCalledWith({
      exchange: options.exchange,
      destination: options.destination,
      amount: options.amount,
    });

    expect(calculateTxFee).toHaveBeenCalledTimes(1);
    expect(calculateTxFee).toHaveBeenNthCalledWith(1, dummyTxPapi, 'someFeeCalcAddress');

    expect(spy).toHaveBeenCalledOnce();
    expect(spy).toHaveBeenCalledWith(swapApi, options, BigNumber(10));

    expect(result).toEqual({
      amountOut: '900',
      txs: [dummyTxPapi],
    });
  });

  it('should propagate errors if swapCurrency fails', async () => {
    vi.spyOn(exchangeChain, 'handleMultiSwap').mockRejectedValue(new Error('swapCurrency failed'));

    await expect(createSwapTx(exchangeChain, options)).rejects.toThrowError('swapCurrency failed');
  });
});
