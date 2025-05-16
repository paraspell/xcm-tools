import type { TPapiTransaction, TXcmFeeDetail } from '@paraspell/sdk';
import { getFeeForOriginNode, getNativeAssetSymbol } from '@paraspell/sdk';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type ExchangeNode from '../../dexNodes/DexNode';
import type { TBuildTransactionsOptionsModified } from '../../types';
import { createSwapTx } from '../createSwapTx';
import { getSwapFee } from './getSwapFee';

vi.mock('../createSwapTx', () => ({
  createSwapTx: vi.fn(),
}));

vi.mock('@paraspell/sdk', () => ({
  getFeeForOriginNode: vi.fn(),
  getNativeAssetSymbol: vi.fn(),
}));

describe('getSwapFee', () => {
  const exchange = { node: 'TEST_NODE' } as unknown as ExchangeNode;
  const options = {
    senderAddress: '0xSender',
    exchange: { apiPapi: 'apiInstance' },
  } as unknown as TBuildTransactionsOptionsModified;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns fee detail and amountOut on success', async () => {
    vi.mocked(createSwapTx).mockResolvedValue({
      tx: 'dummyTx' as unknown as TPapiTransaction,
      amountOut: '100',
    });
    vi.mocked(getFeeForOriginNode).mockResolvedValue({
      fee: 1n,
      feeType: 'paymentInfo',
    });
    vi.mocked(getNativeAssetSymbol).mockReturnValue('DOT');

    const result = await getSwapFee(exchange, options);

    expect(createSwapTx).toHaveBeenCalledWith(exchange, options);
    expect(getFeeForOriginNode).toHaveBeenCalledWith({
      api: 'apiInstance',
      tx: 'dummyTx',
      origin: 'TEST_NODE',
      destination: 'TEST_NODE',
      senderAddress: '0xSender',
      disableFallback: false,
    });
    expect(getNativeAssetSymbol).toHaveBeenCalledWith('TEST_NODE');

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
      tx: 'dummyTx' as unknown as TPapiTransaction,
      amountOut: '100',
    });
    const error = new Error('fee error');
    vi.mocked(getFeeForOriginNode).mockRejectedValue(error);

    await expect(getSwapFee(exchange, options)).rejects.toThrow('fee error');
  });

  it('includes dryRunError when getFeeForOriginNode returns one', async () => {
    const dryError = 'Dry run error';
    vi.mocked(createSwapTx).mockResolvedValue({
      tx: 'dummyTx' as unknown as TPapiTransaction,
      amountOut: '200',
    });
    vi.mocked(getFeeForOriginNode).mockResolvedValue({
      fee: 0n,
      feeType: 'paymentInfo',
      dryRunError: dryError,
    });
    vi.mocked(getNativeAssetSymbol).mockReturnValue('DOT');

    const { result, amountOut } = await getSwapFee(exchange, options);

    expect(result.fee).toBe(0n);
    expect(result.feeType).toBe('paymentInfo');
    expect(result.currency).toBe('DOT');
    expect(result.dryRunError).toBe(dryError);
    expect(amountOut).toBe('200');
  });
});
