import type { TPjsApi } from '@paraspell/sdk-pjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type ExchangeNode from '../dexNodes/DexNode';
import type {
  TAdditionalTransferOptions,
  TBuildTransactionsOptions,
  TRouterEvent,
  TRouterPlan,
  TTransferOptions,
} from '../types';
import { buildTransactions } from './buildTransactions';
import { executeRouterPlan } from './executeRouterPlan';
import { transfer } from './transfer';
import { prepareTransformedOptions } from './utils';
import { validateTransferOptions } from './utils/validateTransferOptions';

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

describe('transfer', () => {
  const mockOriginApi = {} as unknown as TPjsApi;
  const mockSwapApi = {} as unknown as TPjsApi;

  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(validateTransferOptions).mockImplementation(() => {});
    vi.mocked(prepareTransformedOptions).mockResolvedValue({
      options: {
        slippagePct: '1',
        origin: {
          node: 'Acala',
          api: mockOriginApi,
          assetFrom: { symbol: 'ACA' },
        },
        exchange: {
          api: mockSwapApi,
        },
      } as unknown as TBuildTransactionsOptions & TAdditionalTransferOptions,
      dex: {
        node: 'Acala',
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

  it('should throw an error if evmSigner is provided without evmSenderAddress', async () => {
    const options = {
      evmSigner: {},
      from: 'Polkadot',
      to: 'Astar',
    } as TTransferOptions;

    await expect(transfer(options)).rejects.toThrow(
      'evmSenderAddress is required when evmSigner is provided',
    );
  });

  it('should throw an error if evmSenderAddress is provided without evmSigner', async () => {
    const options = {
      evmSenderAddress: '0x123',
      from: 'Polkadot',
      to: 'Astar',
    } as TTransferOptions;

    await expect(transfer(options)).rejects.toThrow(
      'evmSigner is required when evmSenderAddress is provided',
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
  });
});
