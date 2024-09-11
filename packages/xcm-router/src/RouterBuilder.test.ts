import { describe, expect, it, vi, beforeEach, type MockInstance } from 'vitest';
import * as index from './index';
import { RouterBuilder } from './RouterBuilder';
import { type Signer } from '@polkadot/api/types';
import { type Signer as EthSigner } from 'ethers';
import { TransactionType } from './index';

export const transferParams: index.TTransferOptions = {
  from: 'Astar',
  exchange: 'HydrationDex',
  to: 'Moonbeam',
  currencyFrom: { symbol: 'ASTR' },
  currencyTo: { symbol: 'GLMR' },
  amount: '1000000000',
  injectorAddress: '',
  recipientAddress: 'YkszY2JueDnb31wGtFiEQMSZVn9QpJyrn2rTC6tG6UFYKpg',
  signer: {} as unknown as Signer,
  slippagePct: '1',
  type: index.TransactionType.FULL_TRANSFER,
};

const {
  from,
  exchange = 'AcalaDex',
  to,
  currencyFrom,
  currencyTo,
  amount,
  injectorAddress,
  recipientAddress,
  signer,
  slippagePct,
} = transferParams;

// Unit tests for RouterBuilder
describe('Builder', () => {
  let spy: MockInstance;

  beforeEach(() => {
    // eslint-disable-next-line @typescript-eslint/require-await
    spy = vi.spyOn(index, 'transfer').mockImplementation(async () => undefined);
  });

  it('should construct a transfer using RouterBuilder', async () => {
    await RouterBuilder()
      .from(from)
      .exchange(exchange)
      .to(to)
      .currencyFrom(currencyFrom)
      .currencyTo(currencyTo)
      .amount(amount)
      .injectorAddress(injectorAddress)
      .recipientAddress(recipientAddress)
      .signer(signer)
      .slippagePct(slippagePct)
      .build();

    expect(spy).toHaveBeenCalledWith(transferParams);
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
      .injectorAddress(injectorAddress)
      .recipientAddress(recipientAddress)
      .signer(signer)
      .slippagePct(slippagePct)
      .onStatusChange(onStatusChange)
      .build();

    expect(spy).toHaveBeenCalledWith({ ...transferParams, onStatusChange });
  });

  it('should construct a transfer using RouterBuilder with evmInjectorAddress and evmSigner', async () => {
    const onStatusChange = vi.fn();
    const evmInjectorAddress = '0x1234567890';
    const evmSigner = {} as Signer;

    await RouterBuilder()
      .from(from)
      .exchange(exchange)
      .to(to)
      .currencyFrom(currencyFrom)
      .currencyTo(currencyTo)
      .amount(amount)
      .injectorAddress(injectorAddress)
      .recipientAddress(recipientAddress)
      .signer(signer)
      .slippagePct(slippagePct)
      .evmInjectorAddress(evmInjectorAddress)
      .evmSigner(evmSigner)
      .onStatusChange(onStatusChange)
      .build();

    expect(spy).toHaveBeenCalledWith({
      ...transferParams,
      onStatusChange,
      evmInjectorAddress,
      evmSigner,
    });
  });

  it('should construct a transfer using RouterBuilder with assetHubAddress and ethSigner', async () => {
    const onStatusChange = vi.fn();
    const assetHubAddress = '0x1234567890';
    const ethSigner = {} as EthSigner;

    await RouterBuilder()
      .from(from)
      .exchange(exchange)
      .to(to)
      .currencyFrom(currencyFrom)
      .currencyTo(currencyTo)
      .amount(amount)
      .injectorAddress(injectorAddress)
      .recipientAddress(recipientAddress)
      .signer(signer)
      .slippagePct(slippagePct)
      .assetHubAddress(assetHubAddress)
      .ethSigner(ethSigner)
      .onStatusChange(onStatusChange)
      .build();

    expect(spy).toHaveBeenCalledWith({
      ...transferParams,
      onStatusChange,
      assetHubAddress,
      ethSigner,
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
      .injectorAddress(injectorAddress)
      .recipientAddress(recipientAddress)
      .signer(signer)
      .slippagePct(slippagePct)
      .onStatusChange(onStatusChange)
      .build();

    expect(spy).toHaveBeenCalledWith({ ...transferParams, onStatusChange, exchange: undefined });
  });

  it('should construct a transfer using RouterBuilder with defined transaction type', async () => {
    const onStatusChange = vi.fn();
    const type = TransactionType.SWAP;

    await RouterBuilder()
      .from(from)
      .exchange(exchange)
      .to(to)
      .currencyFrom(currencyFrom)
      .currencyTo(currencyTo)
      .amount(amount)
      .injectorAddress(injectorAddress)
      .recipientAddress(recipientAddress)
      .signer(signer)
      .slippagePct(slippagePct)
      .onStatusChange(onStatusChange)
      .transactionType(type)
      .build();

    expect(spy).toHaveBeenCalledWith({
      ...transferParams,
      onStatusChange,
      type,
    });
  });

  it('should fail to construct a transfer using RouterBuilder when missing some params', async () => {
    await expect(async () => {
      await RouterBuilder()
        .from(from)
        .exchange(exchange)
        .to(to)
        .currencyFrom(currencyFrom)
        .currencyTo(currencyTo)
        .amount(amount)
        .injectorAddress(injectorAddress)
        .recipientAddress(recipientAddress)
        .signer(signer)
        .build();
    }).rejects.toThrowError();
  });
});
