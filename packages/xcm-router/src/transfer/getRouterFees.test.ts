import type { TGetXcmFeeResult, TNodePolkadotKusama, TXcmFeeDetail } from '@paraspell/sdk';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type ExchangeNode from '../dexNodes/DexNode';
import type {
  TBuildTransactionsOptionsModified,
  TDestinationInfo,
  TOriginInfo,
  TRouterXcmFeeResult,
} from '../types';
import { getSwapFee } from './fees';
import { getRouterFees } from './getRouterFees';
import { getFromExchangeFee, getToExchangeFee } from './utils';

vi.mock('./fees', () => ({
  getSwapFee: vi.fn(),
}));

vi.mock('./utils', () => ({
  getToExchangeFee: vi.fn(),
  getFromExchangeFee: vi.fn(),
}));

describe('getRouterFees', () => {
  let dex: ExchangeNode;
  let baseNode: TNodePolkadotKusama;
  let options: TBuildTransactionsOptionsModified;

  const swapFee = { fee: BigInt(1234), currency: 'FOO' } as TXcmFeeDetail;
  const swapAmountOut = BigInt(5000);
  const toExchangeFeeValue = { fee: BigInt(10), currency: 'BAR' } as unknown as TGetXcmFeeResult;
  const toDestFeeValue = { fee: BigInt(20), currency: 'BAZ' } as unknown as TGetXcmFeeResult;

  beforeEach(() => {
    dex = {} as ExchangeNode;
    baseNode = 'chain-A' as TNodePolkadotKusama;

    options = {
      exchange: { baseNode },
      senderAddress: '0xdeadbeef',
    } as TBuildTransactionsOptionsModified;

    vi.clearAllMocks();
    vi.mocked(getSwapFee).mockResolvedValue({
      result: swapFee,
      amountOut: swapAmountOut.toString(),
    });
    vi.mocked(getToExchangeFee).mockResolvedValue(toExchangeFeeValue);
    vi.mocked(getFromExchangeFee).mockResolvedValue(toDestFeeValue);
  });

  it('returns only swap when origin & destination are on base chain or undefined', async () => {
    const result = await getRouterFees(dex, options);
    expect(getSwapFee).toHaveBeenCalledOnce();
    expect(getToExchangeFee).not.toHaveBeenCalled();
    expect(getFromExchangeFee).not.toHaveBeenCalled();

    expect(result).toEqual<TRouterXcmFeeResult>({
      sendingChain: undefined,
      exchangeChain: swapFee,
      receivingChain: undefined,
    });
  });

  it('calls getToExchangeFee when origin.node ≠ baseNode', async () => {
    options.origin = { node: 'chain-B', amount: BigInt(1000) } as unknown as TOriginInfo;

    const result = await getRouterFees(dex, options);

    expect(getToExchangeFee).toHaveBeenCalledOnce();
    expect(getToExchangeFee).toHaveBeenCalledWith({
      ...options,
      origin: options.origin,
    });
    expect(result.sendingChain).toBe(toExchangeFeeValue);
    expect(result.exchangeChain).toBe(swapFee);
    expect(result.receivingChain).toBeUndefined();
  });

  it('does NOT call getToExchangeFee when origin.node === baseNode', async () => {
    options.origin = { node: baseNode } as unknown as TOriginInfo;

    const result = await getRouterFees(dex, options);

    expect(getToExchangeFee).not.toHaveBeenCalled();
    expect(result.sendingChain).toBeUndefined();
  });

  it('calls getFromExchangeFee when destination.node ≠ baseNode', async () => {
    options.destination = { node: 'chain-C', min: BigInt(0) } as unknown as TDestinationInfo;

    const result = await getRouterFees(dex, options);

    expect(getFromExchangeFee).toHaveBeenCalledOnce();
    expect(getFromExchangeFee).toHaveBeenCalledWith({
      exchange: options.exchange,
      destination: options.destination,
      amount: swapAmountOut.toString(),
      senderAddress: options.senderAddress,
    });
    expect(result.receivingChain).toBe(toDestFeeValue);
    expect(result.exchangeChain).toBe(swapFee);
    expect(result.sendingChain).toBeUndefined();
  });

  it('does NOT call getFromExchangeFee when destination.node === baseNode', async () => {
    options.destination = { node: baseNode } as unknown as TDestinationInfo;

    const result = await getRouterFees(dex, options);

    expect(getFromExchangeFee).not.toHaveBeenCalled();
    expect(result.receivingChain).toBeUndefined();
  });

  it('handles both origin and destination off‐chain in one go', async () => {
    options.origin = { node: 'chain-B' } as unknown as TOriginInfo;
    options.destination = { node: 'chain-C' } as unknown as TDestinationInfo;

    const result = await getRouterFees(dex, options);

    expect(getToExchangeFee).toHaveBeenCalled();
    expect(getFromExchangeFee).toHaveBeenCalled();
    expect(result).toEqual<TRouterXcmFeeResult>({
      sendingChain: toExchangeFeeValue,
      exchangeChain: swapFee,
      receivingChain: toDestFeeValue,
    });
  });
});
