import type { TPapiTransaction, TXcmFeeDetail } from '@paraspell/sdk';
import { getOriginXcmFee } from '@paraspell/sdk';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type ExchangeNode from '../../dexNodes/DexNode';
import type { TBuildTransactionsOptionsModified } from '../../types';
import { createSwapTx } from '../createSwapTx';
import { getSwapFee } from './getSwapFee';

vi.mock('../createSwapTx', () => ({
  createSwapTx: vi.fn(),
}));

vi.mock('@paraspell/sdk', () => ({
  getOriginXcmFee: vi.fn(),
}));

describe('getSwapFee', () => {
  const exchange = { node: 'TEST_NODE' } as unknown as ExchangeNode;
  const options = {
    senderAddress: '0xSender',
    exchange: { apiPapi: 'apiInstance', assetFrom: { symbol: 'DOT' } },
    amount: '100',
  } as unknown as TBuildTransactionsOptionsModified;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns fee detail and amountOut on success', async () => {
    vi.mocked(createSwapTx).mockResolvedValue({
      txs: ['dummyTx' as unknown as TPapiTransaction],
      amountOut: '100',
    });
    vi.mocked(getOriginXcmFee).mockResolvedValue({
      fee: 1n,
      currency: 'DOT',
      feeType: 'paymentInfo',
    });

    const result = await getSwapFee(exchange, options);

    expect(createSwapTx).toHaveBeenCalledWith(exchange, options);
    expect(getOriginXcmFee).toHaveBeenCalledWith({
      api: 'apiInstance',
      tx: 'dummyTx',
      origin: 'TEST_NODE',
      destination: 'TEST_NODE',
      senderAddress: '0xSender',
      disableFallback: false,
      currency: { symbol: 'DOT', amount: '100' },
    });

    expect(result).toEqual({
      result: {
        fee: 1n,
        feeType: 'paymentInfo',
        currency: 'DOT',
      } as TXcmFeeDetail,
      amountOut: '100',
    });
  });

  it('propagates errors from createSwapTx', async () => {
    const error = new Error('create error');
    vi.mocked(createSwapTx).mockRejectedValue(error);

    await expect(getSwapFee(exchange, options)).rejects.toThrow('create error');
  });

  it('propagates errors from getFeeForOriginNode', async () => {
    vi.mocked(createSwapTx).mockResolvedValue({
      txs: ['dummyTx' as unknown as TPapiTransaction],
      amountOut: '100',
    });
    const error = new Error('fee error');
    vi.mocked(getOriginXcmFee).mockRejectedValue(error);

    await expect(getSwapFee(exchange, options)).rejects.toThrow('fee error');
  });

  it('includes dryRunError when getFeeForOriginNode returns one', async () => {
    const dryError = 'Dry run error';
    vi.mocked(createSwapTx).mockResolvedValue({
      txs: ['dummyTx' as unknown as TPapiTransaction],
      amountOut: '200',
    });
    vi.mocked(getOriginXcmFee).mockResolvedValue({
      fee: 0n,
      currency: 'DOT',
      feeType: 'paymentInfo',
      dryRunError: dryError,
    });

    const { result, amountOut } = await getSwapFee(exchange, options);

    expect(result.fee).toBe(0n);
    expect(result.feeType).toBe('paymentInfo');
    expect(result.currency).toBe('DOT');
    expect(result.dryRunError).toBe(dryError);
    expect(amountOut).toBe('200');
  });

  it('enters currency as location', async () => {
    const dryError = 'Dry run error';
    vi.mocked(createSwapTx).mockResolvedValue({
      txs: ['dummyTx' as unknown as TPapiTransaction],
      amountOut: '200',
    });
    vi.mocked(getOriginXcmFee).mockResolvedValue({
      fee: 0n,
      currency: 'DOT',
      feeType: 'paymentInfo',
      dryRunError: dryError,
    });

    const { result, amountOut } = await getSwapFee(exchange, {
      ...options,
      exchange: { apiPapi: 'apiInstance', assetFrom: { symbol: 'DOT', location: {} } },
    } as unknown as TBuildTransactionsOptionsModified);

    expect(result.fee).toBe(0n);
    expect(result.feeType).toBe('paymentInfo');
    expect(result.currency).toBe('DOT');
    expect(result.dryRunError).toBe(dryError);
    expect(amountOut).toBe('200');
  });
});
