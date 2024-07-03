// Unit tests for main entry point functions

import { vi, describe, it, expect, beforeEach, type MockInstance } from 'vitest';
import * as transferToExchange from './transferToExchange';
import * as swap from './swap';
import * as transferToDestination from './transferToDestination';
import { transfer } from './transfer';
import { MOCK_TRANSFER_OPTIONS } from '../utils/utils.test';
import { TransactionType, type TTransferOptions } from '../types';
import * as selectBestExchange from './selectBestExchange';
import type ExchangeNode from '../dexNodes/DexNode';

vi.mock('@paraspell/sdk', async () => {
  const actual = await vi.importActual('@paraspell/sdk');
  return {
    ...actual,
    createApiInstanceForNode: vi.fn().mockResolvedValue(undefined),
  };
});

describe('transfer', () => {
  let transferToExchangeSpy: MockInstance;
  let swapSpy: MockInstance;
  let createSwapExtrinsicSpy: MockInstance;
  let transferToDestinationSpy: MockInstance;

  beforeEach(() => {
    transferToExchangeSpy = vi
      .spyOn(transferToExchange, 'transferToExchange')
      .mockResolvedValue('');
    swapSpy = vi.spyOn(swap, 'swap').mockResolvedValue('');
    createSwapExtrinsicSpy = vi.spyOn(swap, 'createSwapExtrinsic').mockResolvedValue({
      amountOut: '1',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      tx: {} as any,
    });
    transferToDestinationSpy = vi
      .spyOn(transferToDestination, 'transferToDestination')
      .mockResolvedValue('');
  });

  it('main transfer function - FULL_TRANSFER scenario - manual exchange', async () => {
    const options: TTransferOptions = {
      ...MOCK_TRANSFER_OPTIONS,
      exchange: 'AcalaDex',
      type: TransactionType.FULL_TRANSFER,
    };
    await transfer(options);
    expect(transferToExchangeSpy).toHaveBeenCalled();
    expect(createSwapExtrinsicSpy).toHaveBeenCalled();
    expect(swapSpy).toHaveBeenCalled();
    expect(transferToDestinationSpy).toHaveBeenCalled();
  });

  it('main transfer function - FULL_TRANSFER scenario - auto exchange', async () => {
    const options: TTransferOptions = {
      ...MOCK_TRANSFER_OPTIONS,
      exchange: undefined,
      type: TransactionType.FULL_TRANSFER,
    };

    const selectBestExchangeSpy = vi
      .spyOn(selectBestExchange, 'selectBestExchange')
      .mockReturnValue(
        Promise.resolve({
          node: 'Acala',
          createApiInstance: vi.fn().mockResolvedValue({}),
          swapCurrency: vi.fn().mockResolvedValue({}),
        } as unknown as ExchangeNode),
      );

    await transfer(options);
    expect(transferToExchangeSpy).toHaveBeenCalled();
    expect(swapSpy).toHaveBeenCalled();
    expect(selectBestExchangeSpy).toHaveBeenCalledTimes(1);
    expect(transferToDestinationSpy).toHaveBeenCalled();
  });

  it('main transfer function - TO_EXCHANGE scenario', async () => {
    const options: TTransferOptions = {
      ...MOCK_TRANSFER_OPTIONS,
      exchange: 'AcalaDex',
      type: TransactionType.TO_EXCHANGE,
    };
    await transfer(options);
    expect(transferToExchangeSpy).toHaveBeenCalled();
    expect(swapSpy).not.toHaveBeenCalled();
    expect(transferToDestinationSpy).not.toHaveBeenCalled();
  });

  it('main transfer function - SWAP scenario', async () => {
    const options: TTransferOptions = {
      ...MOCK_TRANSFER_OPTIONS,
      exchange: 'AcalaDex',
      type: TransactionType.SWAP,
    };
    await transfer(options);
    expect(transferToExchangeSpy).not.toHaveBeenCalled();
    expect(swapSpy).toHaveBeenCalled();
    expect(transferToDestinationSpy).not.toHaveBeenCalled();
  });

  it('main transfer function - TO_DESTINATION scenario', async () => {
    const options: TTransferOptions = {
      ...MOCK_TRANSFER_OPTIONS,
      exchange: 'AcalaDex',
      type: TransactionType.TO_DESTINATION,
    };
    await transfer(options);
    expect(transferToExchangeSpy).not.toHaveBeenCalled();
    expect(swapSpy).not.toHaveBeenCalled();
    expect(transferToDestinationSpy).toHaveBeenCalled();
  });
});
