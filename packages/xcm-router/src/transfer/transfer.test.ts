import { describe, it, expect, vi, beforeEach } from 'vitest';
import { transfer } from './transfer';
import type { TRouterEvent, TRouterPlan, TTransferOptions } from '../types';

vi.mock('@paraspell/sdk-pjs', () => {
  return {
    createApiInstanceForNode: vi.fn(),
  };
});

vi.mock('./utils/validateTransferOptions', () => {
  return {
    validateTransferOptions: vi.fn(),
  };
});

vi.mock('./utils', () => {
  return {
    prepareTransformedOptions: vi.fn(),
  };
});

vi.mock('./buildTransactions', () => {
  return {
    buildTransactions: vi.fn(),
  };
});

vi.mock('./executeRouterPlan', () => {
  return {
    executeRouterPlan: vi.fn(),
  };
});

import type { TPjsApi } from '@paraspell/sdk-pjs';
import { createApiInstanceForNode } from '@paraspell/sdk-pjs';
import { validateTransferOptions } from './utils/validateTransferOptions';
import { prepareTransformedOptions } from './utils';
import { buildTransactions } from './buildTransactions';
import { executeRouterPlan } from './executeRouterPlan';
import type ExchangeNode from '../dexNodes/DexNode';

describe('transfer', () => {
  const mockOriginApi = {
    disconnect: vi.fn(),
  };

  const mockSwapApi = {
    disconnect: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(validateTransferOptions).mockImplementation(() => {});
    vi.mocked(createApiInstanceForNode).mockResolvedValue(mockOriginApi as unknown as TPjsApi);
    vi.mocked(prepareTransformedOptions).mockResolvedValue({
      options: {} as Awaited<ReturnType<typeof prepareTransformedOptions>>['options'],
      dex: {
        createApiInstance: vi.fn().mockResolvedValue(mockSwapApi),
      } as unknown as ExchangeNode,
    });
    vi.mocked(buildTransactions).mockResolvedValue([] as TRouterPlan);
    vi.mocked(executeRouterPlan).mockResolvedValue(undefined);
  });

  it('should call validateTransferOptions with the initial options', async () => {
    const initialOptions = {
      from: 'Polkadot',
      to: 'Kusama',
    } as TTransferOptions;

    await transfer(initialOptions);

    expect(validateTransferOptions).toHaveBeenCalledTimes(1);
    expect(validateTransferOptions).toHaveBeenCalledWith(initialOptions);
  });

  it('should throw an error if evmSigner is provided without evmInjectorAddress', async () => {
    const options = {
      evmSigner: {},
      from: 'Polkadot',
      to: 'Astar',
    } as TTransferOptions;

    await expect(transfer(options)).rejects.toThrow(
      'evmInjectorAddress is required when evmSigner is provided',
    );
  });

  it('should throw an error if evmInjectorAddress is provided without evmSigner', async () => {
    const options = {
      evmInjectorAddress: '0x123',
      from: 'Polkadot',
      to: 'Astar',
    } as TTransferOptions;

    await expect(transfer(options)).rejects.toThrow(
      'evmSigner is required when evmInjectorAddress is provided',
    );
  });

  it('should call onStatusChange with SELECTING_EXCHANGE if exchange is undefined', async () => {
    const onStatusChange = vi.fn() as (info: TRouterEvent) => void;
    const options = {
      from: 'Polkadot',
      exchange: undefined,
      to: 'Kusama',
      onStatusChange,
    } as TTransferOptions;

    await transfer(options);

    expect(onStatusChange).toHaveBeenCalledTimes(1);
    expect(onStatusChange).toHaveBeenCalledWith({
      type: 'SELECTING_EXCHANGE',
    });
  });

  it('should not call onStatusChange with SELECTING_EXCHANGE if exchange is provided', async () => {
    const onStatusChange = vi.fn() as (info: TRouterEvent) => void;
    const options = {
      from: 'Polkadot',
      to: 'Kusama',
      exchange: 'AcalaDex',
      onStatusChange,
    } as TTransferOptions;

    await transfer(options);

    expect(onStatusChange).not.toHaveBeenCalledWith({
      type: 'SELECTING_EXCHANGE',
    });
  });

  it('should call prepareTransformedOptions, buildTransactions, and executeRouterPlan', async () => {
    const options = {
      from: 'Polkadot',
      to: 'Kusama',
    } as TTransferOptions;

    await transfer(options);

    expect(prepareTransformedOptions).toHaveBeenCalledTimes(1);
    expect(buildTransactions).toHaveBeenCalledTimes(1);
    expect(executeRouterPlan).toHaveBeenCalledTimes(1);
  });

  it('should create and disconnect both originApi and swapApi', async () => {
    const options = {
      from: 'Polkadot',
      to: 'Kusama',
    } as TTransferOptions;

    await transfer(options);

    expect(createApiInstanceForNode).toHaveBeenCalledWith('Polkadot');
    expect(mockOriginApi.disconnect).toHaveBeenCalledTimes(1);
    expect(mockSwapApi.disconnect).toHaveBeenCalledTimes(1);
  });
});
