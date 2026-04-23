import type { TExchangeInput } from '@paraspell/sdk';
import type { PolkadotApi } from '@paraspell/sdk-core';
import type { PolkadotSigner } from 'polkadot-api';
import { beforeEach, describe, expect, it, type MockInstance, vi } from 'vitest';

import {
  buildApiTransactions,
  getBestAmountOut,
  getMinTransferableAmount,
  getXcmFees,
  transfer,
} from '../transfer';
import type { TTransferBaseOptions } from '../types';
import { RouterBuilder } from './RouterBuilder';

vi.mock('../transfer');

const mockApi = {} as PolkadotApi<unknown, unknown, unknown>;

export const transferParams: TTransferBaseOptions<unknown, unknown, unknown> = {
  from: 'Astar',
  exchange: 'Hydration',
  to: 'Moonbeam',
  currencyFrom: { symbol: 'ASTR' },
  currencyTo: { symbol: 'GLMR' },
  amount: '1000000000',
  sender: 'YkszY2JueDnb31wGtFiEQMSZVn9QpJyrn2rTC6tG6UFYKpg',
  recipient: '0x1501C1413e4178c38567Ada8945A80351F7B8496',
  signer: {},
  slippagePct: '1',
};

const {
  from,
  exchange = 'Acala',
  to,
  currencyFrom,
  currencyTo,
  amount,
  sender,
  recipient,
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
    transferSpy = vi.mocked(transfer).mockResolvedValue(['0x']);
    buildApiTransactionsSpy = vi.mocked(buildApiTransactions).mockResolvedValue([]);
    getBestAmountOutSpy = vi
      .mocked(getBestAmountOut)
      .mockResolvedValue({ amountOut: 900000000n, exchange: 'Acala' });
    getMinTransferableAmountSpy = vi.mocked(getMinTransferableAmount).mockResolvedValue(123n);
  });

  it('should construct transactions using RouterBuilder', async () => {
    await RouterBuilder(mockApi)
      .from(from)
      .exchange(exchange)
      .to(to)
      .currencyFrom(currencyFrom)
      .currencyTo(currencyTo)
      .amount(amount)
      .sender(sender)
      .recipient(recipient)
      .signer(signer)
      .slippagePct(slippagePct)
      .build();

    expect(buildApiTransactionsSpy).toHaveBeenCalledWith({ ...transferParams, api: mockApi });
  });

  it('should construct a transfer using RouterBuilder', async () => {
    await RouterBuilder(mockApi)
      .from(from)
      .exchange(exchange)
      .to(to)
      .currencyFrom(currencyFrom)
      .currencyTo(currencyTo)
      .amount(amount)
      .sender(sender)
      .recipient(recipient)
      .signer(signer)
      .slippagePct(slippagePct)
      .signAndSubmit();

    expect(transferSpy).toHaveBeenCalledWith({ ...transferParams, api: mockApi });
  });

  it('should construct a transfer using RouterBuilder with onStatusChange', async () => {
    const onStatusChange = vi.fn();

    await RouterBuilder(mockApi)
      .from(from)
      .exchange(exchange)
      .to(to)
      .currencyFrom(currencyFrom)
      .currencyTo(currencyTo)
      .amount(amount)
      .sender(sender)
      .recipient(recipient)
      .signer(signer)
      .slippagePct(slippagePct)
      .onStatusChange(onStatusChange)
      .signAndSubmit();

    expect(transferSpy).toHaveBeenCalledWith({ ...transferParams, onStatusChange, api: mockApi });
  });

  it('should construct a transfer using RouterBuilder with evmSenderAddress and evmSigner', async () => {
    const onStatusChange = vi.fn();
    const evmSenderAddress = '0x1234567890';
    const evmSigner = {} as PolkadotSigner;

    await RouterBuilder(mockApi)
      .from(from)
      .exchange(exchange)
      .to(to)
      .currencyFrom(currencyFrom)
      .currencyTo(currencyTo)
      .amount(amount)
      .sender(sender)
      .recipient(recipient)
      .signer(signer)
      .slippagePct(slippagePct)
      .evmSenderAddress(evmSenderAddress)
      .evmSigner(evmSigner)
      .onStatusChange(onStatusChange)
      .signAndSubmit();

    expect(transferSpy).toHaveBeenCalledWith({
      ...transferParams,
      onStatusChange,
      evmSenderAddress,
      evmSigner,
      api: mockApi,
    });
  });

  it('should construct a transfer using RouterBuilder with feeAsset', async () => {
    const feeAsset = { symbol: 'DOT' };

    await RouterBuilder(mockApi)
      .from(from)
      .exchange(exchange)
      .to(to)
      .currencyFrom(currencyFrom)
      .currencyTo(currencyTo)
      .feeAsset(feeAsset)
      .amount(amount)
      .sender(sender)
      .recipient(recipient)
      .signer(signer)
      .slippagePct(slippagePct)
      .signAndSubmit();

    expect(transferSpy).toHaveBeenCalledWith({
      ...transferParams,
      feeAsset,
      api: mockApi,
    });
  });

  it('should construct a transfer using RouterBuilder with automatic selection', async () => {
    const onStatusChange = vi.fn();

    await RouterBuilder(mockApi)
      .from(from)
      .to(to)
      .currencyFrom(currencyFrom)
      .currencyTo(currencyTo)
      .amount(amount)
      .sender(sender)
      .recipient(recipient)
      .signer(signer)
      .slippagePct(slippagePct)
      .onStatusChange(onStatusChange)
      .signAndSubmit();

    expect(transferSpy).toHaveBeenCalledWith({
      ...transferParams,
      onStatusChange,
      exchange: undefined,
      api: mockApi,
    });
  });

  it('should get best amount out', async () => {
    await RouterBuilder(mockApi)
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
    await RouterBuilder(mockApi)
      .from(from)
      .exchange(exchange)
      .to(to)
      .currencyFrom(currencyFrom)
      .currencyTo(currencyTo)
      .amount(amount)
      .sender(sender)
      .recipient(recipient)
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
        sender,
        recipient,
        slippagePct,
        api: mockApi,
      },
      false,
    );
  });

  it('should get min transferable amount', async () => {
    const result = await RouterBuilder(mockApi)
      .from(from)
      .exchange(exchange)
      .to(to)
      .currencyFrom(currencyFrom)
      .currencyTo(currencyTo)
      .amount(amount)
      .sender(sender)
      .recipient(recipient)
      .slippagePct(slippagePct)
      .getMinTransferableAmount();

    expect(result).toBe(123n);
    expect(getMinTransferableAmountSpy).toHaveBeenCalledWith({
      from,
      exchange,
      to,
      currencyFrom,
      currencyTo,
      amount,
      sender,
      recipient,
      slippagePct,
      api: mockApi,
    });
  });

  it('should construct transactions using RouterBuilder with single element exchange array', async () => {
    const exchange: TExchangeInput = ['Hydration'];

    await RouterBuilder(mockApi)
      .from(from)
      .exchange(exchange)
      .to(to)
      .currencyFrom(currencyFrom)
      .currencyTo(currencyTo)
      .amount(amount)
      .sender(sender)
      .recipient(recipient)
      .signer(signer)
      .slippagePct(slippagePct)
      .build();

    expect(buildApiTransactionsSpy).toHaveBeenCalledWith({
      api: mockApi,
      from,
      exchange: exchange[0],
      to,
      currencyFrom,
      currencyTo,
      amount,
      sender,
      recipient,
      signer,
      slippagePct,
    });
  });
});
