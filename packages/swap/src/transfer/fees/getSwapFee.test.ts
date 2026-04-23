import type { PolkadotApi, TAssetInfo } from '@paraspell/sdk-core';
import { AmountTooLowError, applyDecimalAbstraction, getOriginXcmFee } from '@paraspell/sdk-core';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type ExchangeChain from '../../exchanges/ExchangeChain';
import type { TBuildTransactionsOptions, TTransformedOptions } from '../../types';
import { createSwapTx } from '../createSwapTx';
import { getSwapFee } from './getSwapFee';

const mockApi = {} as PolkadotApi<unknown, unknown, unknown>;

vi.mock('../createSwapTx');
vi.mock('@paraspell/sdk-core', async (importActual) => ({
  ...(await importActual()),
  applyDecimalAbstraction: vi.fn(),
  getOriginXcmFee: vi.fn(),
}));

describe('getSwapFee', () => {
  const dotAsset: TAssetInfo = {
    symbol: 'DOT',
    decimals: 10,
    location: {
      parents: 1,
      interior: 'Here',
    },
  };

  const exchange = { chain: 'TEST_CHAIN' } as unknown as ExchangeChain;
  const options = {
    sender: '0xSender',
    exchange: { apiPapi: 'apiInstance', assetFrom: dotAsset, api: mockApi },
    amount: '100',
  } as unknown as TTransformedOptions<
    TBuildTransactionsOptions<unknown, unknown, unknown>,
    unknown,
    unknown,
    unknown
  >;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(applyDecimalAbstraction).mockImplementation((amount) => BigInt(amount));
  });

  it('returns fee detail and amountOut on success; passes buildTx factory', async () => {
    vi.mocked(createSwapTx).mockResolvedValue({
      txs: ['dummyTx'],
      amountOut: 100n,
    });
    vi.mocked(getOriginXcmFee).mockResolvedValue({
      fee: 1n,
      asset: dotAsset,
      feeType: 'paymentInfo',
    });

    const result = await getSwapFee(exchange, options);

    expect(createSwapTx).toHaveBeenCalledWith(exchange, options, true);

    expect(getOriginXcmFee).toHaveBeenCalledWith(
      expect.objectContaining({
        api: mockApi,
        buildTx: expect.any(Function),
        origin: 'TEST_CHAIN',
        destination: 'TEST_CHAIN',
        sender: '0xSender',
        disableFallback: false,
        currency: { location: dotAsset.location, amount: '100' },
      }),
    );

    expect(result).toEqual({
      result: {
        fee: 1n,
        feeType: 'paymentInfo',
        asset: dotAsset,
      },
      amountOut: 100n,
    });
  });

  it('buildTx factory applies decimal abstraction on override and rebuilds tx', async () => {
    vi.mocked(createSwapTx).mockResolvedValue({
      txs: ['tx0'],
      amountOut: 150n,
    });
    vi.mocked(getOriginXcmFee).mockResolvedValue({
      fee: 1n,
      asset: dotAsset,
      feeType: 'paymentInfo',
    });

    await getSwapFee(exchange, options);

    const buildTx = vi.mocked(getOriginXcmFee).mock.calls[0][0].buildTx;

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
      asset: dotAsset,
      feeType: 'paymentInfo',
    });

    const { result, amountOut } = await getSwapFee(exchange, options);

    expect(getOriginXcmFee).toHaveBeenCalledWith(
      expect.objectContaining({
        api: mockApi,
        buildTx: expect.any(Function),
      }),
    );
    expect(result.fee).toBe(3n * 1n);
    expect(amountOut).toBe(0n);
  });

  it('propagates errors from getOriginXcmFee', async () => {
    vi.mocked(createSwapTx).mockResolvedValue({
      txs: ['dummyTx'],
      amountOut: 100n,
    });
    const error = new Error('fee error');
    vi.mocked(getOriginXcmFee).mockRejectedValue(error);

    await expect(getSwapFee(exchange, options)).rejects.toThrow('fee error');
  });

  it('includes dryRunError when getOriginXcmFee returns one', async () => {
    const dryError = 'Dry run error';
    vi.mocked(createSwapTx).mockResolvedValue({
      txs: ['dummyTx'],
      amountOut: 200n,
    });
    vi.mocked(getOriginXcmFee).mockResolvedValue({
      fee: 0n,
      asset: dotAsset,
      feeType: 'paymentInfo',
      dryRunError: dryError,
    });

    const { result, amountOut } = await getSwapFee(exchange, options);

    expect(result.fee).toBe(0n);
    expect(result.feeType).toBe('paymentInfo');
    expect(result.asset).toEqual(dotAsset);
    expect(result.dryRunError).toBe(dryError);
    expect(amountOut).toBe(200n);
  });

  it('enters currency as location when assetFrom includes a location', async () => {
    vi.mocked(createSwapTx).mockResolvedValue({
      txs: ['dummyTx'],
      amountOut: 200n,
    });
    vi.mocked(getOriginXcmFee).mockResolvedValue({
      fee: 0n,
      asset: dotAsset,
      feeType: 'paymentInfo',
    });

    const { result, amountOut } = await getSwapFee(exchange, {
      ...options,
      exchange: {
        apiPapi: 'apiInstance',
        api: 'apiInstance',
        assetFrom: dotAsset,
      },
    } as unknown as TTransformedOptions<
      TBuildTransactionsOptions<unknown, unknown, unknown>,
      unknown,
      unknown,
      unknown
    >);

    expect(result.fee).toBe(0n);
    expect(result.feeType).toBe('paymentInfo');
    expect(result.asset).toEqual(dotAsset);
    expect(amountOut).toBe(200n);
  });
});
