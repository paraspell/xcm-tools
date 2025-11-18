import type { TPapiTransaction } from '@paraspell/sdk';
import { type Extrinsic } from '@paraspell/sdk-pjs';
import type { ApiPromise } from '@polkadot/api';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type ExchangeChain from '../exchanges/ExchangeChain';
import type { TBuildTransactionsOptions, TTransformedOptions } from '../types';
import { isPjsExtrinsic } from '../utils';
import { createSwapTx } from './createSwapTx';
import { buildFromExchangeExtrinsic, convertTxToPapi } from './utils';

vi.mock('./utils');
vi.mock('../utils');

describe('createSwapTx', () => {
  const swapApi = {} as ApiPromise;
  let exchangeChain: ExchangeChain;
  let options: TTransformedOptions<TBuildTransactionsOptions>;
  let dummyExtrinsic: Extrinsic;
  let dummyTxPapi: TPapiTransaction;

  beforeEach(() => {
    vi.resetAllMocks();

    exchangeChain = {
      swapCurrency: vi.fn(),
      handleMultiSwap: vi.fn(),
    } as unknown as ExchangeChain;

    options = {
      amount: 1000n,
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
    } as TTransformedOptions<TBuildTransactionsOptions>;

    dummyExtrinsic = { method: { toHex: () => '0x123' } } as unknown as Extrinsic;
    dummyTxPapi = {
      method: {
        toHex: () => '0x123',
      },
      getEstimatedFees: vi.fn().mockResolvedValue(10n),
    } as unknown as TPapiTransaction;

    vi.mocked(buildFromExchangeExtrinsic).mockResolvedValue(dummyTxPapi);
    vi.spyOn(exchangeChain, 'handleMultiSwap').mockResolvedValue({
      amountOut: 900n,
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

    expect(dummyTxPapi.getEstimatedFees).toHaveBeenCalledTimes(1);
    expect(dummyTxPapi.getEstimatedFees).toHaveBeenNthCalledWith(1, 'someFeeCalcAddress');

    expect(spy).toHaveBeenCalledOnce();
    expect(spy).toHaveBeenCalledWith(swapApi, { ...options, isForFeeEstimation: false }, 10n);

    expect(result).toEqual({
      amountOut: 900n,
      txs: [dummyTxPapi],
    });
  });
});
