import type { TPapiApi } from '@paraspell/sdk';
import type { PolkadotApi, TAssetInfo, TXcmFeeDetail } from '@paraspell/sdk-core';
import {
  getBalance,
  getExistentialDepositOrThrow,
  getNativeAssetSymbol,
} from '@paraspell/sdk-core';
import type { TPjsApi, TSubstrateChain } from '@paraspell/sdk-pjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type ExchangeChain from '../exchanges/ExchangeChain';
import type { TBuildTransactionsOptions } from '../types';
import type {
  TAdditionalTransferOptions,
  TBuildTransactionsBaseOptions,
  TExchangeInfo,
  TOriginInfo,
  TTransformedOptions,
} from '../types/TRouter';
import { getSwapFee } from './fees';
import { getTransferableAmount } from './getTransferableAmount';
import {
  createToExchangeBuilder,
  prepareTransformedOptions,
  validateTransferOptions,
} from './utils';

vi.mock('@paraspell/sdk-core', async (importActual) => ({
  ...(await importActual()),
  getBalance: vi.fn(),
  getExistentialDepositOrThrow: vi.fn(),
  getNativeAssetSymbol: vi.fn(),
}));

vi.mock('./utils');
vi.mock('./fees');

const mockApi = {} as PolkadotApi<unknown, unknown, unknown>;

const sdkAsset: TAssetInfo = {
  symbol: 'DOT',
  assetId: '1',
  decimals: 10,
  location: {
    parents: 1,
    interior: 'Here',
  },
};

const routerAsset: TAssetInfo = {
  symbol: 'ASTR',
  assetId: 'ASTR-ID',
  decimals: 18,
  location: {
    parents: 1,
    interior: {
      X1: [{ Parachain: 1000 }],
    },
  },
};

const createExchangeInfo = (
  assetFromSymbol: string,
  assetToSymbol?: string,
): TExchangeInfo<unknown, unknown, unknown> => ({
  apiPjs: {} as TPjsApi,
  apiPapi: {} as TPapiApi,
  api: {} as unknown as PolkadotApi<unknown, unknown, unknown>,
  chain: 'Hydration',
  assetFrom: {
    ...routerAsset,
    symbol: assetFromSymbol,
  },
  assetTo: assetToSymbol
    ? {
        ...routerAsset,
        symbol: assetToSymbol,
      }
    : routerAsset,
});

const createOriginInfo = (chain: TSubstrateChain): TOriginInfo<unknown> => ({
  api: {},
  chain,
  assetFrom: sdkAsset,
});

const createOptions = (
  overrides: Partial<TBuildTransactionsBaseOptions<unknown, unknown, unknown>> = {},
): TBuildTransactionsBaseOptions<unknown, unknown, unknown> => ({
  from: 'Polkadot',
  exchange: 'Hydration',
  to: undefined,
  currencyFrom: { symbol: 'DOT' },
  currencyTo: { symbol: 'ASTR' },
  amount: '1000',
  sender: 'sender',
  recipient: undefined,
  evmSenderAddress: undefined,
  slippagePct: '1',
  ...overrides,
});

const createTransformedOptions = (
  overrides: Partial<
    TTransformedOptions<
      TBuildTransactionsOptions<unknown, unknown, unknown>,
      unknown,
      unknown,
      unknown
    >
  > = {},
): TBuildTransactionsOptions<unknown, unknown, unknown> &
  TAdditionalTransferOptions<unknown, unknown, unknown> => {
  const { exchange: _ignored, ...rest } = createOptions();

  const base = {
    ...rest,
    exchange: createExchangeInfo('HDX'),
    origin: undefined,
    destination: undefined,
    feeCalcAddress: rest.sender,
    api: mockApi,
  };

  return {
    ...base,
    ...overrides,
  } as unknown as TBuildTransactionsOptions<unknown, unknown, unknown> &
    TAdditionalTransferOptions<unknown, unknown, unknown>;
};

const createExchangeChainStub = (): ExchangeChain =>
  ({
    chain: 'Hydration',
  }) as ExchangeChain;

describe('getTransferableAmount', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('delegates to the SDK builder when origin differs from exchange chain', async () => {
    const builderMock = { getTransferableAmount: vi.fn().mockResolvedValue(123n) };

    vi.mocked(prepareTransformedOptions).mockResolvedValue({
      dex: createExchangeChainStub(),
      options: createTransformedOptions({
        origin: createOriginInfo('Polkadot'),
        exchange: createExchangeInfo('DOT'),
        amount: 1000n,
      }),
    });

    vi.mocked(createToExchangeBuilder).mockReturnValue(builderMock as never);

    const initialOptions = createOptions();
    const result = await getTransferableAmount({ ...initialOptions, api: mockApi });

    expect(result).toBe(123n);
    expect(builderMock.getTransferableAmount).toHaveBeenCalledTimes(1);
    expect(createToExchangeBuilder).toHaveBeenCalledWith({
      origin: expect.objectContaining({ chain: 'Polkadot' }),
      exchange: expect.objectContaining({ chain: 'Hydration' }),
      sender: 'sender',
      evmSenderAddress: undefined,
      amount: 1000n,
      api: mockApi,
    });
    expect(getBalance).not.toHaveBeenCalled();
    expect(getSwapFee).not.toHaveBeenCalled();
    expect(validateTransferOptions).toHaveBeenCalledWith({ ...initialOptions, api: mockApi });
  });

  it('computes transferable amount locally when already on exchange chain', async () => {
    vi.mocked(prepareTransformedOptions).mockResolvedValue({
      dex: createExchangeChainStub(),
      options: createTransformedOptions({
        origin: undefined,
        exchange: createExchangeInfo('HDX'),
      }),
    });

    vi.mocked(getBalance).mockResolvedValue(2000n);
    vi.mocked(getExistentialDepositOrThrow).mockReturnValue(100n);
    vi.mocked(getNativeAssetSymbol).mockReturnValue('HDX');
    const swapDetail: TXcmFeeDetail = {
      fee: 300n,
      feeType: 'dryRun',
      asset: {
        ...sdkAsset,
        symbol: 'HDX',
      },
    };
    vi.mocked(getSwapFee).mockResolvedValue({ result: swapDetail, amountOut: 0n });

    const result = await getTransferableAmount({
      ...createOptions({ from: undefined }),
      api: mockApi,
    });

    expect(result).toBe(1600n);
    expect(getBalance).toHaveBeenCalledWith({
      api: expect.anything(),
      chain: 'Hydration',
      address: 'sender',
      currency: expect.objectContaining({ location: routerAsset.location }),
    });
    expect(getExistentialDepositOrThrow).toHaveBeenCalledWith('Hydration', expect.anything());
    expect(getSwapFee).toHaveBeenCalledTimes(1);
  });

  it('does not subtract swap fee when the sent asset is not the native token', async () => {
    vi.mocked(prepareTransformedOptions).mockResolvedValue({
      dex: createExchangeChainStub(),
      options: createTransformedOptions({
        origin: undefined,
        exchange: createExchangeInfo('DOT'),
      }),
    });

    vi.mocked(getBalance).mockResolvedValue(1000n);
    vi.mocked(getExistentialDepositOrThrow).mockReturnValue(100n);
    vi.mocked(getNativeAssetSymbol).mockReturnValue('HDX');

    const result = await getTransferableAmount({ ...createOptions(), api: mockApi });

    expect(result).toBe(900n);
    expect(getSwapFee).not.toHaveBeenCalled();
  });
});
