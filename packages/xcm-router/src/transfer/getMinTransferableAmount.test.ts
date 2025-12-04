import {
  getExistentialDepositOrThrow,
  getNativeAssetSymbol,
  type TAssetInfo,
  type TPapiApi,
  type TXcmFeeDetail,
} from '@paraspell/sdk';
import type { TPjsApi, TSubstrateChain } from '@paraspell/sdk-pjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type ExchangeChain from '../exchanges/ExchangeChain';
import type { TBuildTransactionsOptions } from '../types';
import type {
  TExchangeInfo,
  TOriginInfo,
  TRouterAsset,
  TTransformedOptions,
} from '../types/TRouter';
import { getSwapFee } from './fees';
import { getMinTransferableAmount } from './getMinTransferableAmount';
import {
  createToExchangeBuilder,
  prepareTransformedOptions,
  validateTransferOptions,
} from './utils';

vi.mock('./utils');
vi.mock('./fees');
vi.mock('@paraspell/sdk');

const createRouterAsset = (symbol: string, decimals = 12): TRouterAsset => ({
  symbol,
  decimals,
  assetId: `${symbol}-ID`,
});

const createAssetInfo = (symbol: string, decimals = 12): TAssetInfo =>
  ({
    symbol,
    decimals,
    assetId: `${symbol}-ID`,
  }) as TAssetInfo;

const createExchangeInfo = (assetFromSymbol: string, assetToSymbol = 'ASTR'): TExchangeInfo => ({
  api: {} as TPjsApi,
  apiPapi: {} as TPapiApi,
  baseChain: 'Hydration',
  exchangeChain: 'HydrationDex',
  assetFrom: createRouterAsset(assetFromSymbol),
  assetTo: createRouterAsset(assetToSymbol),
});

const createOriginInfo = (chain: TSubstrateChain, assetSymbol: string): TOriginInfo => ({
  api: {} as TPapiApi,
  chain,
  assetFrom: createAssetInfo(assetSymbol),
});

const createOptions = (
  overrides: Partial<TBuildTransactionsOptions> = {},
): TBuildTransactionsOptions => ({
  from: 'Hydration',
  exchange: 'HydrationDex',
  to: 'Moonbeam',
  currencyFrom: { symbol: 'HDX' },
  currencyTo: { symbol: 'GLMR' },
  amount: '1000',
  senderAddress: 'sender',
  recipientAddress: 'recipient',
  evmSenderAddress: undefined,
  slippagePct: '1',
  ...overrides,
});

const createTransformedOptions = (
  overrides: Partial<TTransformedOptions<TBuildTransactionsOptions>> = {},
) => {
  const { exchange: _ignored, ...rest } = createOptions();

  const base = {
    ...rest,
    exchange: createExchangeInfo('HDX'),
    origin: undefined,
    destination: undefined,
    feeCalcAddress: rest.senderAddress,
    builderOptions: undefined,
  };

  return {
    ...base,
    ...overrides,
  } as TTransformedOptions<TBuildTransactionsOptions>;
};

const createExchangeChainStub = (): ExchangeChain =>
  ({
    chain: 'Hydration',
    exchangeChain: 'HydrationDex',
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
    const result = await getMinTransferableAmount(initialOptions);

    expect(result).toBe(123n);
    expect(builderMock.getMinTransferableAmount).toHaveBeenCalledTimes(1);
    expect(createToExchangeBuilder).toHaveBeenCalledWith({
      origin: expect.objectContaining({ chain: 'Polkadot' }),
      exchange: expect.objectContaining({ baseChain: 'Hydration' }),
      senderAddress: 'sender',
      evmSenderAddress: undefined,
      amount: '1000',
      builderOptions: undefined,
    });
    expect(getExistentialDepositOrThrow).not.toHaveBeenCalled();
    expect(getSwapFee).not.toHaveBeenCalled();
    expect(validateTransferOptions).toHaveBeenCalledWith(initialOptions);
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

    const result = await getMinTransferableAmount(createOptions());

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

    const result = await getMinTransferableAmount(createOptions());

    expect(getSwapFee).toHaveBeenCalledTimes(1);
    expect(result).toBe(31n);
  });
});
