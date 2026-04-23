import type { TPapiApi } from '@paraspell/sdk';
import type { PolkadotApi, TAssetInfo, TXcmFeeDetail } from '@paraspell/sdk-core';
import { getExistentialDepositOrThrow, getNativeAssetSymbol } from '@paraspell/sdk-core';
import type { TPjsApi, TSubstrateChain } from '@paraspell/sdk-pjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type ExchangeChain from '../exchanges/ExchangeChain';
import type { TBuildTransactionsOptions } from '../types';
import type {
  TBuildTransactionsBaseOptions,
  TExchangeInfo,
  TOriginInfo,
  TTransformedOptions,
} from '../types';
import { getSwapFee } from './fees';
import { getMinTransferableAmount } from './getMinTransferableAmount';
import {
  createToExchangeBuilder,
  prepareTransformedOptions,
  validateTransferOptions,
} from './utils';

vi.mock('./utils');
vi.mock('./fees');
vi.mock('@paraspell/sdk-core', async (importActual) => ({
  ...(await importActual()),
  getExistentialDepositOrThrow: vi.fn(),
  getNativeAssetSymbol: vi.fn(),
}));

const mockApi = {} as PolkadotApi<unknown, unknown, unknown>;

const createRouterAsset = (symbol: string, decimals = 12): TAssetInfo => ({
  symbol,
  decimals,
  assetId: `${symbol}-ID`,
  location: { parents: 1, interior: 'Here' },
});

const createAssetInfo = (symbol: string, decimals = 12): TAssetInfo =>
  ({
    symbol,
    decimals,
    assetId: `${symbol}-ID`,
  }) as TAssetInfo;

const createExchangeInfo = (
  assetFromSymbol: string,
  assetToSymbol = 'ASTR',
): TExchangeInfo<unknown, unknown, unknown> => ({
  apiPjs: {} as TPjsApi,
  apiPapi: {} as TPapiApi,
  api: mockApi,
  chain: 'Hydration',
  assetFrom: createRouterAsset(assetFromSymbol),
  assetTo: createRouterAsset(assetToSymbol),
});

const createOriginInfo = (chain: TSubstrateChain, assetSymbol: string): TOriginInfo<unknown> => ({
  api: {},
  chain,
  assetFrom: createAssetInfo(assetSymbol),
});

const createOptions = (
  overrides: Partial<TBuildTransactionsBaseOptions<unknown, unknown, unknown>> = {},
): TBuildTransactionsBaseOptions<unknown, unknown, unknown> => ({
  from: 'Hydration',
  exchange: 'Hydration',
  to: 'Moonbeam',
  currencyFrom: { symbol: 'HDX' },
  currencyTo: { symbol: 'GLMR' },
  amount: '1000',
  sender: 'sender',
  recipient: 'recipient',
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
) => {
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
  } as TTransformedOptions<
    TBuildTransactionsOptions<unknown, unknown, unknown>,
    unknown,
    unknown,
    unknown
  >;
};

const createExchangeChainStub = (): ExchangeChain =>
  ({
    chain: 'Hydration',
  }) as ExchangeChain;

describe('getMinTransferableAmount', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('delegates to SDK builder when origin is defined', async () => {
    const builderMock = { getMinTransferableAmount: vi.fn().mockResolvedValue(123n) };

    vi.mocked(prepareTransformedOptions).mockResolvedValue({
      dex: createExchangeChainStub(),
      options: {
        ...createTransformedOptions({
          origin: createOriginInfo('Polkadot', 'DOT'),
          exchange: createExchangeInfo('DOT'),
        }),
      },
    });

    vi.mocked(createToExchangeBuilder).mockReturnValue(builderMock as never);

    const initialOptions = createOptions({ from: 'Polkadot' });
    const result = await getMinTransferableAmount({ ...initialOptions, api: mockApi });

    expect(result).toBe(123n);
    expect(builderMock.getMinTransferableAmount).toHaveBeenCalledTimes(1);
    expect(createToExchangeBuilder).toHaveBeenCalledWith({
      origin: expect.objectContaining({ chain: 'Polkadot' }),
      exchange: expect.objectContaining({ chain: 'Hydration' }),
      sender: 'sender',
      evmSenderAddress: undefined,
      amount: '1000',
      api: mockApi,
    });
    expect(getExistentialDepositOrThrow).not.toHaveBeenCalled();
    expect(getSwapFee).not.toHaveBeenCalled();
    expect(validateTransferOptions).toHaveBeenCalledWith({ ...initialOptions, api: mockApi });
  });

  it('returns ED + 1 when asset is not native', async () => {
    vi.mocked(prepareTransformedOptions).mockResolvedValue({
      dex: createExchangeChainStub(),
      options: createTransformedOptions({
        origin: undefined,
        exchange: createExchangeInfo('DOT'),
      }),
    });

    vi.mocked(getExistentialDepositOrThrow).mockReturnValue(42n);
    vi.mocked(getNativeAssetSymbol).mockReturnValue('HDX');

    const result = await getMinTransferableAmount({ ...createOptions(), api: mockApi });

    expect(result).toBe(43n);
    expect(getSwapFee).not.toHaveBeenCalled();
  });

  it('adds swap fee when asset is native', async () => {
    vi.mocked(prepareTransformedOptions).mockResolvedValue({
      dex: createExchangeChainStub(),
      options: createTransformedOptions({
        origin: undefined,
        exchange: createExchangeInfo('HDX'),
      }),
    });

    vi.mocked(getExistentialDepositOrThrow).mockReturnValue(10n);
    vi.mocked(getNativeAssetSymbol).mockReturnValue('HDX');
    const swapDetail: TXcmFeeDetail = {
      fee: 20n,
      feeType: 'dryRun',
      asset: createAssetInfo('HDX'),
    };
    vi.mocked(getSwapFee).mockResolvedValue({ result: swapDetail, amountOut: 0n });

    const result = await getMinTransferableAmount({ ...createOptions(), api: mockApi });

    expect(getSwapFee).toHaveBeenCalledTimes(1);
    expect(result).toBe(31n);
  });
});
