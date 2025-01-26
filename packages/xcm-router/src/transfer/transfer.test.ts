// Unit tests for main entry point functions

import { vi, describe, it, expect, beforeEach } from 'vitest';
import { transfer } from './transfer';
import { TransactionType, type TTransferOptions } from '../types';
import type ExchangeNode from '../dexNodes/DexNode';
import type { Signer } from '@polkadot/types/types';
import type { Extrinsic } from '@paraspell/sdk-pjs';
import { createApiInstanceForNode } from '@paraspell/sdk-pjs';
import type { ApiPromise } from '@polkadot/api';
import { createSwapTx } from './createSwapTx';
import { MOCK_TRANSFER_OPTIONS } from '../utils/testUtils';
import { transferToExchange } from './transferToExchange';
import { swap } from './swap';
import { transferToDestination } from './transferToDestination';
import { selectBestExchange } from './selectBestExchange';
import { createAcalaApiInstance } from '../dexNodes/Acala/utils';

vi.mock('@paraspell/sdk-pjs', async () => {
  const actual = await vi.importActual('@paraspell/sdk-pjs');
  return {
    ...actual,
    createApiInstanceForNode: vi.fn().mockResolvedValue({
      disconnect: async () => {},
    }),
  };
});

vi.mock('./utils', async () => {
  const actual = await vi.importActual('./utils');
  return {
    ...actual,
    buildFromExchangeExtrinsic: vi.fn(),
    buildToExchangeExtrinsic: vi.fn(),
  };
});

vi.mock('./createSwapTx', () => ({
  createSwapTx: vi.fn(),
}));

vi.mock('../utils/utils', () => ({
  delay: vi.fn(),
  calculateTransactionFee: vi.fn(),
}));

vi.mock('./transferToExchange', () => ({
  transferToExchange: vi.fn(),
}));

vi.mock('./swap', () => ({
  swap: vi.fn(),
}));

vi.mock('./transferToDestination', () => ({
  transferToDestination: vi.fn(),
}));

vi.mock('./transferToEthereum', () => ({
  transferToEthereum: vi.fn(),
}));

vi.mock('./transferFromEthereum', () => ({
  transferFromEthereum: vi.fn(),
}));

vi.mock('./selectBestExchange', () => ({
  selectBestExchange: vi.fn(),
}));

vi.mock('../../dexNodes/DexNodeFactory', () => ({
  createDexNodeInstance: vi.fn(),
}));

vi.mock('../dexNodes/Acala/utils', () => ({
  createAcalaApiInstance: vi.fn(),
}));

describe('transfer', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(transferToExchange).mockResolvedValue('');
    vi.mocked(swap).mockResolvedValue('');
    vi.mocked(createSwapTx).mockResolvedValue({
      amountOut: '1',
      tx: {} as Extrinsic,
    });
    vi.mocked(transferToDestination).mockResolvedValue('');
    vi.mocked(createAcalaApiInstance).mockResolvedValue({
      disconnect: async () => {},
    } as ApiPromise);
    vi.mocked(createApiInstanceForNode).mockResolvedValue({
      disconnect: async () => {},
    } as ApiPromise);
  });

  it('main transfer function - FULL_TRANSFER scenario - manual exchange', async () => {
    const options: TTransferOptions = {
      ...MOCK_TRANSFER_OPTIONS,
      exchange: 'AcalaDex',
      type: TransactionType.FULL_TRANSFER,
    };
    await transfer(options);
    expect(transferToExchange).toHaveBeenCalled();
    expect(createSwapTx).toHaveBeenCalled();
    expect(swap).toHaveBeenCalled();
    expect(transferToDestination).toHaveBeenCalled();
  });

  it('main transfer function - FULL_TRANSFER scenario - auto exchange', async () => {
    const options: TTransferOptions = {
      ...MOCK_TRANSFER_OPTIONS,
      currencyFrom: { id: '18446744073709551619' },
      currencyTo: { id: '18446744073709551616' },
      exchange: undefined,
      type: TransactionType.FULL_TRANSFER,
    };

    vi.mocked(selectBestExchange).mockReturnValue(
      Promise.resolve({
        node: 'Acala',
        exchangeNode: 'AcalaDex',
        createApiInstance: vi.fn().mockResolvedValue({
          disconnect: () => {},
        }),
        swapCurrency: vi.fn().mockResolvedValue({}),
      } as unknown as ExchangeNode),
    );

    await transfer(options);
    expect(transferToExchange).toHaveBeenCalled();
    expect(swap).toHaveBeenCalled();
    expect(selectBestExchange).toHaveBeenCalledTimes(1);
    expect(transferToDestination).toHaveBeenCalled();
  });

  it('main transfer function - TO_EXCHANGE scenario', async () => {
    const options: TTransferOptions = {
      ...MOCK_TRANSFER_OPTIONS,
      exchange: 'AcalaDex',
      type: TransactionType.TO_EXCHANGE,
    };
    await transfer(options);
    expect(transferToExchange).toHaveBeenCalled();
    expect(swap).not.toHaveBeenCalled();
    expect(transferToDestination).not.toHaveBeenCalled();
  });

  it('main transfer function - SWAP scenario', async () => {
    const options: TTransferOptions = {
      ...MOCK_TRANSFER_OPTIONS,
      exchange: 'AcalaDex',
      type: TransactionType.SWAP,
    };
    await transfer(options);
    expect(transferToExchange).not.toHaveBeenCalled();
    expect(swap).toHaveBeenCalled();
    expect(transferToDestination).not.toHaveBeenCalled();
  });

  it('main transfer function - TO_DESTINATION scenario', async () => {
    const options: TTransferOptions = {
      ...MOCK_TRANSFER_OPTIONS,
      exchange: 'AcalaDex',
      type: TransactionType.TO_DESTINATION,
    };
    await transfer(options);
    expect(transferToExchange).not.toHaveBeenCalled();
    expect(swap).not.toHaveBeenCalled();
    expect(transferToDestination).toHaveBeenCalled();
  });

  it('error handling - evmInjectorAddress without evmSigner', async () => {
    const options: TTransferOptions = {
      ...MOCK_TRANSFER_OPTIONS,
      exchange: 'HydrationDex',
      evmInjectorAddress: '0x1501C1413e4178c38567Ada8945A80351F7B8496',
      evmSigner: undefined,
    };
    await expect(transfer(options)).rejects.toThrow(
      'evmSigner is required when evmInjectorAddress is provided',
    );
  });

  it('error handling - evmSigner without evmInjectorAddress', async () => {
    const options: TTransferOptions = {
      ...MOCK_TRANSFER_OPTIONS,
      exchange: 'HydrationDex',
      evmInjectorAddress: undefined,
      evmSigner: {} as Signer,
    };
    await expect(transfer(options)).rejects.toThrow(
      'evmInjectorAddress is required when evmSigner is provided',
    );
  });

  it('error handling - invalid evmInjectorAddress', async () => {
    const options: TTransferOptions = {
      ...MOCK_TRANSFER_OPTIONS,
      exchange: 'HydrationDex',
      evmInjectorAddress: 'INVALID',
      evmSigner: {} as Signer,
    };
    await expect(transfer(options)).rejects.toThrow(
      'Evm injector address is not a valid Ethereum address',
    );
  });

  it('error handling - invalid injectorAddress', async () => {
    const options: TTransferOptions = {
      ...MOCK_TRANSFER_OPTIONS,
      exchange: 'HydrationDex',
      injectorAddress: '0x1501C1413e4178c38567Ada8945A80351F7B8496',
    };
    await expect(transfer(options)).rejects.toThrow(
      'Injector address cannot be an Ethereum address. Please use an Evm injector address instead.',
    );
  });

  it('skips extrinsic building for transactions already on the exchange', async () => {
    const options: TTransferOptions = {
      ...MOCK_TRANSFER_OPTIONS,
      from: 'Acala',
      exchange: 'AcalaDex',
      type: TransactionType.TO_EXCHANGE,
    };
    await transfer(options);
    expect(transferToExchange).not.toHaveBeenCalled();
  });

  it('skips extrinsic building for transactions already on the exchange - FULL_TRANSFER', async () => {
    const options: TTransferOptions = {
      ...MOCK_TRANSFER_OPTIONS,
      from: 'Acala',
      exchange: 'AcalaDex',
      type: TransactionType.FULL_TRANSFER,
    };
    await transfer(options);
    expect(transferToExchange).not.toHaveBeenCalled();
  });

  it('skips extrinsic building for transactions already on destination', async () => {
    const options: TTransferOptions = {
      ...MOCK_TRANSFER_OPTIONS,
      to: 'Acala',
      exchange: 'AcalaDex',
      type: TransactionType.TO_DESTINATION,
    };
    await transfer(options);
    expect(transferToDestination).not.toHaveBeenCalled();
  });

  it('skips extrinsic building for transactions already on destination - FULL_TRANSFER', async () => {
    const options: TTransferOptions = {
      ...MOCK_TRANSFER_OPTIONS,
      to: 'Acala',
      exchange: 'AcalaDex',
      type: TransactionType.FULL_TRANSFER,
    };
    await transfer(options);
    expect(transferToDestination).not.toHaveBeenCalled();
  });
});
