import {
  getAssetBalance,
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
  TAdditionalTransferOptions,
  TExchangeInfo,
  TOriginInfo,
  TRouterAsset,
  TTransformedOptions,
} from '../types/TRouter';
import { getSwapFee } from './fees';
import { getTransferableAmount } from './getTransferableAmount';
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
  from: 'Polkadot',
  exchange: 'HydrationDex',
  to: undefined,
  currencyFrom: { symbol: 'DOT' },
  currencyTo: { symbol: 'ASTR' },
  amount: '1000',
  senderAddress: 'sender',
  recipientAddress: undefined,
  evmSenderAddress: undefined,
  slippagePct: '1',
  ...overrides,
});

const createTransformedOptions = (
  overrides: Partial<TTransformedOptions<TBuildTransactionsOptions>> = {},
): TBuildTransactionsOptions & TAdditionalTransferOptions => {
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
  } as unknown as TBuildTransactionsOptions & TAdditionalTransferOptions;
};

const createExchangeChainStub = (): ExchangeChain =>
  ({
    chain: 'Hydration',
    exchangeChain: 'HydrationDex',
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
        origin: createOriginInfo('Polkadot', 'DOT'),
        exchange: createExchangeInfo('DOT'),
        amount: 1000n,
      }),
    });

    vi.mocked(createToExchangeBuilder).mockReturnValue(builderMock as never);

    const initialOptions = createOptions();
    const result = await getTransferableAmount(initialOptions);

    expect(result).toBe(123n);
    expect(builderMock.getTransferableAmount).toHaveBeenCalledTimes(1);
    expect(createToExchangeBuilder).toHaveBeenCalledWith({
      origin: expect.objectContaining({ chain: 'Polkadot' }),
      exchange: expect.objectContaining({ baseChain: 'Hydration' }),
      senderAddress: 'sender',
      evmSenderAddress: undefined,
      amount: 1000n,
      builderOptions: undefined,
    });
    expect(getAssetBalance).not.toHaveBeenCalled();
    expect(getSwapFee).not.toHaveBeenCalled();
    expect(validateTransferOptions).toHaveBeenCalledWith(initialOptions);
  });

  it('computes transferable amount locally when already on exchange chain', async () => {
    vi.mocked(prepareTransformedOptions).mockResolvedValue({
      dex: createExchangeChainStub(),
      options: createTransformedOptions({
        origin: undefined,
        exchange: createExchangeInfo('HDX'),
      }),
    });

    vi.mocked(getAssetBalance).mockResolvedValue(2000n);
    vi.mocked(getExistentialDepositOrThrow).mockReturnValue(100n);
    vi.mocked(getNativeAssetSymbol).mockReturnValue('HDX');
    const swapDetail: TXcmFeeDetail = {
      fee: 300n,
      feeType: 'dryRun',
      currency: 'HDX',
      asset: createAssetInfo('HDX'),
    };
    vi.mocked(getSwapFee).mockResolvedValue({ result: swapDetail, amountOut: 0n });

    const result = await getTransferableAmount(createOptions({ from: undefined }));

    expect(result).toBe(1600n);
    expect(getAssetBalance).toHaveBeenCalledWith({
      api: expect.anything(),
      chain: 'Hydration',
      address: 'sender',
      currency: expect.objectContaining({ id: 'HDX-ID' }),
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

    vi.mocked(getAssetBalance).mockResolvedValue(1000n);
    vi.mocked(getExistentialDepositOrThrow).mockReturnValue(100n);
    vi.mocked(getNativeAssetSymbol).mockReturnValue('HDX');

    const result = await getTransferableAmount(createOptions());

    expect(result).toBe(900n);
    expect(getSwapFee).not.toHaveBeenCalled();
  });
});
