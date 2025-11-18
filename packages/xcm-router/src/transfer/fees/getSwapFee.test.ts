import type { TAssetInfo, TPapiTransaction, TXcmFeeDetail } from '@paraspell/sdk';
import { AmountTooLowError, applyDecimalAbstraction, getOriginXcmFee } from '@paraspell/sdk';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type ExchangeChain from '../../exchanges/ExchangeChain';
import type { TBuildTransactionsOptions, TTransformedOptions } from '../../types';
import { createSwapTx } from '../createSwapTx';
import { getSwapFee } from './getSwapFee';

vi.mock('../createSwapTx');
vi.mock('@paraspell/sdk');

describe('getSwapFee', () => {
  const exchange = { chain: 'TEST_CHAIN' } as unknown as ExchangeChain;
  const options = {
    senderAddress: '0xSender',
    exchange: { apiPapi: 'apiInstance', assetFrom: { symbol: 'DOT', decimals: 10 } },
    amount: '100',
  } as unknown as TTransformedOptions<TBuildTransactionsOptions>;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(applyDecimalAbstraction).mockImplementation((amount) => BigInt(amount));
  });

  it('returns fee detail and amountOut on success; passes buildTx factory', async () => {
    vi.mocked(createSwapTx).mockResolvedValue({
      txs: ['dummyTx' as unknown as TPapiTransaction],
      amountOut: 100n,
    });
    vi.mocked(getOriginXcmFee).mockResolvedValue({
      fee: 1n,
      currency: 'DOT',
      asset: { symbol: 'DOT' } as TAssetInfo,
      feeType: 'paymentInfo',
    });

    const result = await getSwapFee(exchange, options);

    expect(createSwapTx).toHaveBeenCalledWith(exchange, options, true);

    expect(getOriginXcmFee).toHaveBeenCalledWith(
      expect.objectContaining({
        api: 'apiInstance',
        buildTx: expect.any(Function),
        origin: 'TEST_CHAIN',
        destination: 'TEST_CHAIN',
        senderAddress: '0xSender',
        disableFallback: false,
        currency: { symbol: 'DOT', amount: '100' },
      }),
    );

    expect(result).toEqual({
      result: {
        fee: 1n,
        feeType: 'paymentInfo',
        currency: 'DOT',
        asset: { symbol: 'DOT' },
      } as TXcmFeeDetail,
      amountOut: 100n,
    });
  });

  it('buildTx factory applies decimal abstraction on override and rebuilds tx', async () => {
    vi.mocked(createSwapTx).mockResolvedValue({
      txs: ['tx0' as unknown as TPapiTransaction],
      amountOut: 150n,
    });
    vi.mocked(getOriginXcmFee).mockResolvedValue({
      fee: 1n,
      currency: 'DOT',
      asset: { symbol: 'DOT' } as TAssetInfo,
      feeType: 'paymentInfo',
    });

    await getSwapFee(exchange, options);

    const buildTx = vi.mocked(getOriginXcmFee).mock.calls[0][0].buildTx as (
      a?: string,
    ) => Promise<unknown>;

    vi.mocked(createSwapTx).mockClear();

    await buildTx('123');

    expect(applyDecimalAbstraction).toHaveBeenCalledWith('123', 10, true);
    expect(createSwapTx).toHaveBeenCalledWith(
      exchange,
      expect.objectContaining({
        amount: 123n,
      }),
      true,
    );
  });

  it('propagates non-AmountTooLowError from createSwapTx', async () => {
    const error = new Error('create error');
    vi.mocked(createSwapTx).mockRejectedValue(error);

    await expect(getSwapFee(exchange, options)).rejects.toThrow('create error');
  });

  it('handles AmountTooLowError from createSwapTx by using txs.length = 1 and amountOut = "0"', async () => {
    vi.mocked(createSwapTx).mockRejectedValueOnce(new AmountTooLowError());
    vi.mocked(getOriginXcmFee).mockResolvedValue({
      fee: 3n,
      currency: 'DOT',
      asset: { symbol: 'DOT' } as TAssetInfo,
      feeType: 'paymentInfo',
    });

    const { result, amountOut } = await getSwapFee(exchange, options);

    expect(getOriginXcmFee).toHaveBeenCalledWith(
      expect.objectContaining({
        api: 'apiInstance',
        buildTx: expect.any(Function),
      }),
    );
    expect(result.fee).toBe(3n * 1n);
    expect(amountOut).toBe(0n);
  });

  it('propagates errors from getOriginXcmFee', async () => {
    vi.mocked(createSwapTx).mockResolvedValue({
      txs: ['dummyTx' as unknown as TPapiTransaction],
      amountOut: 100n,
    });
    const error = new Error('fee error');
    vi.mocked(getOriginXcmFee).mockRejectedValue(error);

    await expect(getSwapFee(exchange, options)).rejects.toThrow('fee error');
  });

  it('includes dryRunError when getOriginXcmFee returns one', async () => {
    const dryError = 'Dry run error';
    vi.mocked(createSwapTx).mockResolvedValue({
      txs: ['dummyTx' as unknown as TPapiTransaction],
      amountOut: 200n,
    });
    vi.mocked(getOriginXcmFee).mockResolvedValue({
      fee: 0n,
      currency: 'DOT',
      asset: { symbol: 'DOT' } as TAssetInfo,
      feeType: 'paymentInfo',
      dryRunError: dryError,
    });

    const { result, amountOut } = await getSwapFee(exchange, options);

    expect(result.fee).toBe(0n);
    expect(result.feeType).toBe('paymentInfo');
    expect(result.asset).toEqual({ symbol: 'DOT' });
    expect(result.dryRunError).toBe(dryError);
    expect(amountOut).toBe(200n);
  });

  it('enters currency as location when assetFrom includes a location', async () => {
    vi.mocked(createSwapTx).mockResolvedValue({
      txs: ['dummyTx' as unknown as TPapiTransaction],
      amountOut: 200n,
    });
    vi.mocked(getOriginXcmFee).mockResolvedValue({
      fee: 0n,
      currency: 'DOT',
      asset: { symbol: 'DOT' } as TAssetInfo,
      feeType: 'paymentInfo',
    });

    const { result, amountOut } = await getSwapFee(exchange, {
      ...options,
      exchange: {
        apiPapi: 'apiInstance',
        assetFrom: { symbol: 'DOT', location: {}, decimals: 10 },
      },
    } as unknown as TTransformedOptions<TBuildTransactionsOptions>);

    expect(result.fee).toBe(0n);
    expect(result.feeType).toBe('paymentInfo');
    expect(result.asset).toEqual({ symbol: 'DOT' });
    expect(amountOut).toBe(200n);
  });
});
