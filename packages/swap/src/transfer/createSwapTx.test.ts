import type { TPapiTransaction } from '@paraspell/sdk';
import type { IPolkadotApi } from '@paraspell/sdk-core';
import { type Extrinsic } from '@paraspell/sdk-pjs';
import type { ApiPromise } from '@polkadot/api';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type ExchangeChain from '../exchanges/ExchangeChain';
import type { TBuildTransactionsOptions, TTransformedOptions } from '../types';
import { isPjsExtrinsic } from '../utils';
import { createSwapTx } from './createSwapTx';
import { buildFromExchangeExtrinsic, convertTxToTarget } from './utils';

const getPaymentInfoSpy = vi.fn().mockResolvedValue({ partialFee: 10n });
const mockApi = {
  getPaymentInfo: getPaymentInfoSpy,
} as unknown as IPolkadotApi<unknown, unknown, unknown>;

vi.mock('./utils');
vi.mock('../utils');

describe('createSwapTx', () => {
  const swapApi = {} as ApiPromise;
  let exchangeChain: ExchangeChain;
  let options: TTransformedOptions<
    TBuildTransactionsOptions<unknown, unknown, unknown>,
    unknown,
    unknown,
    unknown
  >;
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
        apiPjs: swapApi,
        assetTo: { decimals: 10 },
      },
      origin: {
        chain: 'Acala',
      },
      to: 'Astar',
      destination: {
        chain: 'Astar',
      },
      api: mockApi,
    } as TTransformedOptions<
      TBuildTransactionsOptions<unknown, unknown, unknown>,
      unknown,
      unknown,
      unknown
    >;

    dummyExtrinsic = { method: { toHex: () => '0x123' } } as unknown as Extrinsic;
    dummyTxPapi = {
      method: {
        toHex: () => '0x123',
      },
      getEstimatedFees: vi.fn().mockResolvedValue(10n),
    } as unknown as TPapiTransaction;

    vi.mocked(buildFromExchangeExtrinsic).mockResolvedValue(dummyTxPapi);
    getPaymentInfoSpy.mockResolvedValue({ partialFee: 10n, weight: 0n });
    vi.spyOn(exchangeChain, 'handleMultiSwap').mockResolvedValue({
      amountOut: 900n,
      txs: [dummyExtrinsic],
    });

    vi.mocked(convertTxToTarget).mockResolvedValue(dummyTxPapi);
    vi.mocked(isPjsExtrinsic).mockReturnValue(true);
  });

  it('should build extrinsics, calculate fees, and call swapCurrency', async () => {
    const spy = vi.spyOn(exchangeChain, 'handleMultiSwap');

    const result = await createSwapTx(exchangeChain, options);

    expect(buildFromExchangeExtrinsic).toHaveBeenCalledOnce();
    expect(buildFromExchangeExtrinsic).toHaveBeenCalledWith(
      expect.objectContaining({
        exchange: options.exchange,
        destination: options.destination,
      }),
    );

    expect(getPaymentInfoSpy).toHaveBeenCalledTimes(1);
    expect(getPaymentInfoSpy).toHaveBeenNthCalledWith(1, dummyTxPapi, 'someFeeCalcAddress');

    expect(spy).toHaveBeenCalledOnce();
    expect(spy).toHaveBeenCalledWith(
      swapApi,
      expect.objectContaining({ ...options, isForFeeEstimation: false }),
      10n,
    );

    expect(result).toEqual({
      amountOut: 900n,
      txs: [dummyTxPapi],
    });
  });
});
