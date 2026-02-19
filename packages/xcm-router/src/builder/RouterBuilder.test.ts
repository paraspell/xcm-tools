import type { PolkadotSigner } from 'polkadot-api';
import { beforeEach, describe, expect, it, type MockInstance, vi } from 'vitest';

import {
  buildApiTransactions,
  getBestAmountOut,
  getMinTransferableAmount,
  getXcmFees,
  transfer,
} from '../transfer';
import type { TExchangeInput, TTransferOptions } from '../types';
import { RouterBuilder } from './RouterBuilder';

vi.mock('../transfer');

export const transferParams: TTransferOptions = {
  from: 'Astar',
  exchange: 'HydrationDex',
  to: 'Moonbeam',
  currencyFrom: { symbol: 'ASTR' },
  currencyTo: { symbol: 'GLMR' },
  amount: '1000000000',
  senderAddress: 'YkszY2JueDnb31wGtFiEQMSZVn9QpJyrn2rTC6tG6UFYKpg',
  recipientAddress: '0x1501C1413e4178c38567Ada8945A80351F7B8496',
  signer: {} as unknown as PolkadotSigner,
  slippagePct: '1',
};

const {
  from,
  exchange = 'AcalaDex',
  to,
  currencyFrom,
  currencyTo,
  amount,
  senderAddress,
  recipientAddress,
  signer,
  slippagePct,
} = transferParams;

describe('Builder', () => {
  let transferSpy: MockInstance;
  let buildApiTransactionsSpy: MockInstance;
  let getBestAmountOutSpy: MockInstance;
  let getMinTransferableAmountSpy: MockInstance;

  beforeEach(() => {
    vi.clearAllMocks();
    transferSpy = vi.mocked(transfer).mockResolvedValue(undefined);
    buildApiTransactionsSpy = vi.mocked(buildApiTransactions).mockResolvedValue([]);
    getBestAmountOutSpy = vi
      .mocked(getBestAmountOut)
      .mockResolvedValue({ amountOut: 900000000n, exchange: 'AcalaDex' });
    getMinTransferableAmountSpy = vi.mocked(getMinTransferableAmount).mockResolvedValue(123n);
  });

  it('should construct transactions using RouterBuilder', async () => {
    await RouterBuilder()
      .from(from)
      .exchange(exchange)
      .to(to)
      .currencyFrom(currencyFrom)
      .currencyTo(currencyTo)
      .amount(amount)
      .senderAddress(senderAddress)
      .recipientAddress(recipientAddress)
      .signer(signer)
      .slippagePct(slippagePct)
      .buildTransactions();

    expect(buildApiTransactionsSpy).toHaveBeenCalledWith(transferParams, undefined);
  });

  it('should construct a transfer using RouterBuilder', async () => {
    await RouterBuilder()
      .from(from)
      .exchange(exchange)
      .to(to)
      .currencyFrom(currencyFrom)
      .currencyTo(currencyTo)
      .amount(amount)
      .senderAddress(senderAddress)
      .recipientAddress(recipientAddress)
      .signer(signer)
      .slippagePct(slippagePct)
      .build();

    expect(transferSpy).toHaveBeenCalledWith(transferParams, undefined);
  });

  it('should construct a transfer using RouterBuilder with onStatusChange', async () => {
    const onStatusChange = vi.fn();

    await RouterBuilder()
      .from(from)
      .exchange(exchange)
      .to(to)
      .currencyFrom(currencyFrom)
      .currencyTo(currencyTo)
      .amount(amount)
      .senderAddress(senderAddress)
      .recipientAddress(recipientAddress)
      .signer(signer)
      .slippagePct(slippagePct)
      .onStatusChange(onStatusChange)
      .build();

    expect(transferSpy).toHaveBeenCalledWith({ ...transferParams, onStatusChange }, undefined);
  });

  it('should construct a transfer using RouterBuilder with evmSenderAddress and evmSigner', async () => {
    const onStatusChange = vi.fn();
    const evmSenderAddress = '0x1234567890';
    const evmSigner = {} as PolkadotSigner;

    await RouterBuilder()
      .from(from)
      .exchange(exchange)
      .to(to)
      .currencyFrom(currencyFrom)
      .currencyTo(currencyTo)
      .amount(amount)
      .senderAddress(senderAddress)
      .recipientAddress(recipientAddress)
      .signer(signer)
      .slippagePct(slippagePct)
      .evmSenderAddress(evmSenderAddress)
      .evmSigner(evmSigner)
      .onStatusChange(onStatusChange)
      .build();

    expect(transferSpy).toHaveBeenCalledWith(
      {
        ...transferParams,
        onStatusChange,
        evmSenderAddress,
        evmSigner,
      },
      undefined,
    );
  });

  it('should construct a transfer using RouterBuilder with feeAsset', async () => {
    const feeAsset = { symbol: 'DOT' };

    await RouterBuilder()
      .from(from)
      .exchange(exchange)
      .to(to)
      .currencyFrom(currencyFrom)
      .currencyTo(currencyTo)
      .feeAsset(feeAsset)
      .amount(amount)
      .senderAddress(senderAddress)
      .recipientAddress(recipientAddress)
      .signer(signer)
      .slippagePct(slippagePct)
      .build();

    expect(transferSpy).toHaveBeenCalledWith(
      {
        ...transferParams,
        feeAsset,
      },
      undefined,
    );
  });

  it('should construct a transfer using RouterBuilder with automatic selection', async () => {
    const onStatusChange = vi.fn();

    await RouterBuilder()
      .from(from)
      .to(to)
      .currencyFrom(currencyFrom)
      .currencyTo(currencyTo)
      .amount(amount)
      .senderAddress(senderAddress)
      .recipientAddress(recipientAddress)
      .signer(signer)
      .slippagePct(slippagePct)
      .onStatusChange(onStatusChange)
      .build();

    expect(transferSpy).toHaveBeenCalledWith(
      {
        ...transferParams,
        onStatusChange,
        exchange: undefined,
      },
      undefined,
    );
  });

  it('should get best amount out', async () => {
    await RouterBuilder()
      .from(from)
      .exchange(exchange)
      .to(to)
      .currencyFrom(currencyFrom)
      .currencyTo(currencyTo)
      .amount(amount)
      .getBestAmountOut();

    expect(getBestAmountOutSpy).toHaveBeenCalled();
  });

  it('should get xcm fees', async () => {
    await RouterBuilder()
      .from(from)
      .exchange(exchange)
      .to(to)
      .currencyFrom(currencyFrom)
      .currencyTo(currencyTo)
      .amount(amount)
      .senderAddress(senderAddress)
      .recipientAddress(recipientAddress)
      .slippagePct(slippagePct)
      .getXcmFees();

    expect(getXcmFees).toHaveBeenCalledWith(
      {
        from,
        exchange,
        to,
        currencyFrom,
        currencyTo,
        amount,
        senderAddress,
        recipientAddress,
        slippagePct,
      },
      undefined,
    );
  });

  it('should get min transferable amount', async () => {
    const result = await RouterBuilder()
      .from(from)
      .exchange(exchange)
      .to(to)
      .currencyFrom(currencyFrom)
      .currencyTo(currencyTo)
      .amount(amount)
      .senderAddress(senderAddress)
      .recipientAddress(recipientAddress)
      .slippagePct(slippagePct)
      .getMinTransferableAmount();

    expect(result).toBe(123n);
    expect(getMinTransferableAmountSpy).toHaveBeenCalledWith(
      {
        from,
        exchange,
        to,
        currencyFrom,
        currencyTo,
        amount,
        senderAddress,
        recipientAddress,
        slippagePct,
      },
      undefined,
    );
  });

  it('should construct transactions using RouterBuilder with single element exchange array', async () => {
    await RouterBuilder()
      .from(from)
      .exchange([exchange] as TExchangeInput)
      .to(to)
      .currencyFrom(currencyFrom)
      .currencyTo(currencyTo)
      .amount(amount)
      .senderAddress(senderAddress)
      .recipientAddress(recipientAddress)
      .signer(signer)
      .slippagePct(slippagePct)
      .buildTransactions();

    expect(buildApiTransactionsSpy).toHaveBeenCalledWith(
      {
        from,
        exchange: [exchange],
        to,
        currencyFrom,
        currencyTo,
        amount,
        senderAddress,
        recipientAddress,
        signer,
        slippagePct,
      },
      undefined,
    );
  });
});
