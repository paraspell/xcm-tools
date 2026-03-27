import type { IPolkadotApi, TSwapEvent } from '@paraspell/sdk-core';
import { isChainEvm, MissingParameterError } from '@paraspell/sdk-core';
import type { TPjsApi } from '@paraspell/sdk-pjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type ExchangeChain from '../exchanges/ExchangeChain';
import type {
  TAdditionalTransferOptions,
  TBuildTransactionsOptions,
  TRouterPlan,
  TTransferBaseOptions,
} from '../types';

const mockApi = {} as IPolkadotApi<unknown, unknown, unknown>;
import { buildTransactions } from './buildTransactions';
import { executeRouterPlan } from './executeRouterPlan';
import { transfer } from './transfer';
import { prepareTransformedOptions } from './utils';
import { validateTransferOptions } from './utils/validateTransferOptions';

vi.mock('@paraspell/sdk-core', async (importActual) => ({
  ...(await importActual()),
  isChainEvm: vi.fn(),
}));

vi.mock('./utils/validateTransferOptions');
vi.mock('./utils');
vi.mock('./buildTransactions');
vi.mock('./executeRouterPlan');

describe('transfer', () => {
  const mockOriginApi = {} as unknown as TPjsApi;
  const mockSwapApi = {} as unknown as TPjsApi;
  const mockExchangeApi = {} as unknown as IPolkadotApi<unknown, unknown, unknown>;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(isChainEvm).mockReturnValue(false);

    vi.mocked(validateTransferOptions).mockImplementation(() => {});
    vi.mocked(prepareTransformedOptions).mockResolvedValue({
      options: {
        slippagePct: '1',
        origin: {
          chain: 'Acala',
          api: mockOriginApi,
          assetFrom: { symbol: 'ACA' },
        },
        exchange: {
          api: mockExchangeApi,
        },
        api: mockApi,
      } as TBuildTransactionsOptions<unknown, unknown, unknown> &
        TAdditionalTransferOptions<unknown, unknown, unknown>,
      dex: {
        chain: 'Acala',
        createApiInstance: vi.fn().mockResolvedValue(mockSwapApi),
      } as unknown as ExchangeChain,
    });
    vi.mocked(buildTransactions).mockResolvedValue([] as TRouterPlan<unknown, unknown>);
    vi.mocked(executeRouterPlan).mockResolvedValue(['0x']);
  });

  it('should call validateTransferOptions with the initial options', async () => {
    const initialOptions = {
      from: 'Polkadot',
      to: 'Kusama',
    } as TTransferBaseOptions<unknown, unknown, unknown>;

    await transfer({ ...initialOptions, api: mockApi });

    expect(validateTransferOptions).toHaveBeenCalledTimes(1);
    expect(validateTransferOptions).toHaveBeenCalledWith({ ...initialOptions, api: mockApi });
  });

  it('should throw an error if evmSigner is provided without evmSenderAddress', async () => {
    const options = {
      evmSigner: {},
      from: 'Polkadot',
      to: 'Astar',
    } as TTransferBaseOptions<unknown, unknown, unknown>;

    await expect(transfer({ ...options, api: mockApi })).rejects.toThrow(MissingParameterError);
  });

  it('should throw an error if evmSenderAddress is provided without evmSigner', async () => {
    const options = {
      evmSenderAddress: '0x123',
      from: 'Polkadot',
      to: 'Astar',
    } as TTransferBaseOptions<unknown, unknown, unknown>;

    await expect(transfer({ ...options, api: mockApi })).rejects.toThrow(MissingParameterError);
  });

  it('should call onStatusChange with SELECTING_EXCHANGE if exchange is undefined', async () => {
    const onStatusChange = vi.fn() as (info: TSwapEvent<unknown, unknown>) => void;
    const options = {
      from: 'Polkadot',
      exchange: undefined,
      to: 'Kusama',
      onStatusChange,
    } as TTransferBaseOptions<unknown, unknown, unknown>;

    await transfer({ ...options, api: mockApi });

    expect(onStatusChange).toHaveBeenCalledTimes(1);
    expect(onStatusChange).toHaveBeenCalledWith({
      type: 'SELECTING_EXCHANGE',
    });
  });

  it('should not call onStatusChange with SELECTING_EXCHANGE if exchange is provided', async () => {
    const onStatusChange = vi.fn() as (info: TSwapEvent<unknown, unknown>) => void;
    const options = {
      from: 'Polkadot',
      to: 'Kusama',
      exchange: 'AcalaDex',
      onStatusChange,
    } as TTransferBaseOptions<unknown, unknown, unknown>;

    await transfer({ ...options, api: mockApi });

    expect(onStatusChange).not.toHaveBeenCalledWith({
      type: 'SELECTING_EXCHANGE',
    });
  });

  it('should call prepareTransformedOptions, buildTransactions, and executeRouterPlan', async () => {
    const options = {
      from: 'Polkadot',
      to: 'Kusama',
    } as TTransferBaseOptions<unknown, unknown, unknown>;

    await transfer({ ...options, api: mockApi });

    expect(prepareTransformedOptions).toHaveBeenCalledTimes(1);
    expect(buildTransactions).toHaveBeenCalledTimes(1);
    expect(executeRouterPlan).toHaveBeenCalledTimes(1);
  });

  it('should throw an error if origin chain is EVM and evmSigner is missing', async () => {
    const options = {
      from: 'Moonbeam',
      to: 'Astar',
    } as TTransferBaseOptions<unknown, unknown, unknown>;

    vi.mocked(isChainEvm).mockReturnValue(true);

    await expect(transfer({ ...options, api: mockApi })).rejects.toThrow(
      'EVM signer must be provided for EVM origin chains.',
    );
  });

  it('should create and disconnect both originApi and swapApi', async () => {
    const options = {
      from: 'Polkadot',
      to: 'Kusama',
    } as TTransferBaseOptions<unknown, unknown, unknown>;

    await transfer({ ...options, api: mockApi });
  });
});
