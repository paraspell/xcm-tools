import type { PolkadotSigner } from 'polkadot-api';
import { beforeEach, describe, expect, it, type MockInstance, vi } from 'vitest';

import { buildApiTransactions, getXcmFees, transfer } from '../transfer';
import type { TTransferOptions } from '../types';
import { RouterBuilder } from './RouterBuilder';

vi.mock('../transfer', () => ({
  buildApiTransactions: vi.fn(),
  transfer: vi.fn(),
  getBestAmountOut: vi.fn(),
  getXcmFees: vi.fn(),
}));

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

  beforeEach(() => {
    transferSpy = vi.mocked(transfer).mockResolvedValue(undefined);
    buildApiTransactionsSpy = vi.mocked(buildApiTransactions).mockResolvedValue([]);
    getBestAmountOutSpy = vi.mocked(transfer).mockResolvedValue(undefined);
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

    expect(buildApiTransactionsSpy).toHaveBeenCalledWith(transferParams);
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

    expect(transferSpy).toHaveBeenCalledWith(transferParams);
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

    expect(transferSpy).toHaveBeenCalledWith({ ...transferParams, onStatusChange });
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

    expect(transferSpy).toHaveBeenCalledWith({
      ...transferParams,
      onStatusChange,
      evmSenderAddress,
      evmSigner,
    });
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

    expect(transferSpy).toHaveBeenCalledWith({
      ...transferParams,
      onStatusChange,
      exchange: undefined,
    });
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

    expect(getBestAmountOutSpy).toHaveBeenCalledWith(transferParams);
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

    expect(getXcmFees).toHaveBeenCalledWith({
      from,
      exchange,
      to,
      currencyFrom,
      currencyTo,
      amount,
      senderAddress,
      recipientAddress,
      slippagePct,
    });
  });
});
