import type {
  PolkadotApi,
  TAssetInfo,
  THopTransferInfo,
  TXcmFeeDetailSuccess,
} from '@paraspell/sdk-core';
import {
  aggregateHopFees,
  assertCurrencyCore,
  buildDestInfo,
  buildOriginInfo,
  findAssetInfoOrThrow,
  getRelayChainSymbol,
} from '@paraspell/sdk-core';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type ExchangeChain from '../../exchanges/ExchangeChain';
import type { TBuildTransactionsOptions, TTransformedOptions } from '../../types';
import { getSwapExecuteXcmFee } from '../utils';
import { buildExecuteSwapHops } from './buildExecuteSwapHops';
import { getExecuteSwapInfo } from './getExecuteSwapInfo';

vi.mock('../utils', async (importActual) => ({
  ...(await importActual()),
  getSwapExecuteXcmFee: vi.fn(),
}));
vi.mock('./buildExecuteSwapHops');
vi.mock('@paraspell/sdk-core', async (importActual) => ({
  ...(await importActual()),
  aggregateHopFees: vi.fn(),
  assertCurrencyCore: vi.fn(),
  buildDestInfo: vi.fn(),
  buildOriginInfo: vi.fn(),
  findAssetInfoOrThrow: vi.fn(),
  getRelayChainSymbol: vi.fn(),
}));

const mockApi = {} as PolkadotApi<unknown, unknown, unknown>;

const dotAsset: TAssetInfo = {
  symbol: 'DOT',
  decimals: 10,
  location: { parents: 1, interior: 'Here' },
};

const usdtAsset: TAssetInfo = {
  symbol: 'USDT',
  decimals: 6,
  location: { parents: 0, interior: 'Here' },
};

const acaAsset: TAssetInfo = {
  symbol: 'ACA',
  decimals: 12,
  location: { parents: 0, interior: 'Here' },
};

const exchangeInfo = {
  chain: 'Hydration',
  api: mockApi,
  apiPjs: {},
  apiPapi: {},
  assetFrom: dotAsset,
  assetTo: usdtAsset,
} as unknown as TTransformedOptions<
  TBuildTransactionsOptions<unknown, unknown, unknown>,
  unknown,
  unknown,
  unknown
>['exchange'];

const dex = { chain: 'Hydration' } as unknown as ExchangeChain;

const baseOptions = {
  api: mockApi,
  exchange: exchangeInfo,
  currencyFrom: { symbol: 'DOT' },
  currencyTo: { symbol: 'USDT' },
  amount: 1000n,
  sender: 'Alice',
  recipient: 'Bob',
  feeCalcAddress: 'Alice',
} as unknown as TTransformedOptions<
  TBuildTransactionsOptions<unknown, unknown, unknown>,
  unknown,
  unknown,
  unknown
>;

const originFee: TXcmFeeDetailSuccess = {
  fee: 7n,
  asset: dotAsset,
  feeType: 'paymentInfo',
};

const destFee: TXcmFeeDetailSuccess = {
  fee: 3n,
  asset: usdtAsset,
  feeType: 'paymentInfo',
};

const originInfo = {
  selectedCurrency: [
    {
      sufficient: true,
      balance: 100n,
      balanceAfter: 90n,
      asset: dotAsset,
    },
  ],
  xcmFee: {
    fee: 7n,
    asset: dotAsset,
    sufficient: true,
    balance: 100n,
    balanceAfter: 93n,
  },
};

const destinationInfo = {
  receivedCurrency: {
    sufficient: true,
    receivedAmount: 500n,
    balance: 0n,
    balanceAfter: 500n,
    asset: usdtAsset,
  },
  xcmFee: { fee: 0n, asset: usdtAsset, balance: 0n, balanceAfter: 0n },
};

const builtHops: THopTransferInfo[] = [
  {
    chain: 'Hydration',
    result: {
      asset: usdtAsset,
      xcmFee: { fee: 1n, asset: dotAsset },
      isExchange: true,
    },
  },
];

describe('getExecuteSwapInfo', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getRelayChainSymbol).mockReturnValue('Polkadot');
    vi.mocked(findAssetInfoOrThrow).mockReturnValue(acaAsset);
    vi.mocked(buildOriginInfo).mockResolvedValue(originInfo);
    vi.mocked(buildDestInfo).mockResolvedValue(destinationInfo);
    vi.mocked(buildExecuteSwapHops).mockResolvedValue(builtHops);
    vi.mocked(aggregateHopFees).mockReturnValue({ totalHopFee: 0n });
    vi.mocked(getSwapExecuteXcmFee).mockResolvedValue({
      result: {
        success: true,
        origin: originFee,
        destination: destFee,
        hops: [],
      },
      amountOut: 500n,
    });
  });

  it('asserts both currencyFrom and currencyTo', async () => {
    await getExecuteSwapInfo(dex, baseOptions);

    expect(assertCurrencyCore).toHaveBeenCalledWith(baseOptions.currencyFrom);
    expect(assertCurrencyCore).toHaveBeenCalledWith(baseOptions.currencyTo);
  });

  it('marks both origin and destination as exchange when neither is supplied', async () => {
    const result = await getExecuteSwapInfo(dex, baseOptions);

    expect(result.origin.isExchange).toBe(true);
    expect(result.destination.isExchange).toBe(true);
    expect(result.chain).toEqual({
      origin: 'Hydration',
      destination: 'Hydration',
      ecosystem: 'Polkadot',
    });
    expect(getRelayChainSymbol).toHaveBeenCalledWith('Hydration');
  });

  it('uses exchange.assetFrom when no origin is supplied', async () => {
    await getExecuteSwapInfo(dex, baseOptions);

    expect(findAssetInfoOrThrow).not.toHaveBeenCalled();
    expect(buildOriginInfo).toHaveBeenCalledWith(
      expect.objectContaining({
        origin: 'Hydration',
        sender: 'Alice',
        amount: 1000n,
        assets: [{ ...dotAsset, amount: 1000n }],
        originFee: originFee.fee,
        originFeeAsset: originFee.asset,
        isFeeAssetAh: false,
      }),
    );
  });

  it('looks up origin asset and uses origin chain when origin is supplied', async () => {
    const optionsWithOrigin = {
      ...baseOptions,
      origin: { api: mockApi, chain: 'Acala', assetFrom: acaAsset },
    } as typeof baseOptions;

    const result = await getExecuteSwapInfo(dex, optionsWithOrigin);

    expect(findAssetInfoOrThrow).toHaveBeenCalledWith(
      'Acala',
      baseOptions.currencyFrom,
      'Hydration',
    );
    expect(buildOriginInfo).toHaveBeenCalledWith(
      expect.objectContaining({
        origin: 'Acala',
        assets: [{ ...acaAsset, amount: 1000n }],
      }),
    );
    expect(result.chain.origin).toBe('Acala');
    expect(result.origin.isExchange).toBeUndefined();
  });

  it('uses destination chain when destination is supplied and looks up asset against it', async () => {
    const optionsWithDest = {
      ...baseOptions,
      destination: { chain: 'Moonbeam', address: 'Carol' },
    } as typeof baseOptions;

    const result = await getExecuteSwapInfo(dex, optionsWithDest);

    expect(buildDestInfo).toHaveBeenCalledWith(
      expect.objectContaining({
        origin: 'Hydration',
        destination: 'Moonbeam',
        recipient: 'Bob',
      }),
    );
    expect(result.chain.destination).toBe('Moonbeam');
    expect(result.destination.isExchange).toBeUndefined();
  });

  it('falls back to sender when no recipient is supplied', async () => {
    const { recipient: _recipient, ...rest } = baseOptions as typeof baseOptions & {
      recipient?: string;
    };

    await getExecuteSwapInfo(dex, rest as typeof baseOptions);

    expect(buildDestInfo).toHaveBeenCalledWith(expect.objectContaining({ recipient: 'Alice' }));
  });

  it('prefers evmSenderAddress over sender for origin and hops', async () => {
    const evmOptions = { ...baseOptions, evmSenderAddress: '0xEvm' } as typeof baseOptions;

    await getExecuteSwapInfo(dex, evmOptions);

    expect(buildOriginInfo).toHaveBeenCalledWith(expect.objectContaining({ sender: '0xEvm' }));
    expect(buildExecuteSwapHops).toHaveBeenCalledWith(expect.objectContaining({ sender: '0xEvm' }));
  });

  it('passes amountOut and currencyTo to buildDestInfo', async () => {
    await getExecuteSwapInfo(dex, baseOptions);

    expect(buildDestInfo).toHaveBeenCalledWith(
      expect.objectContaining({
        currency: { ...baseOptions.currencyTo, amount: 500n },
        destFeeDetail: destFee,
        originFee: originFee.fee,
        isFeeAssetAh: false,
      }),
    );
  });

  it('aggregates only post-swap hops and passes their fees to buildDestInfo', async () => {
    const preSwap = {
      chain: 'AssetHubPolkadot' as const,
      result: { fee: 1n, asset: dotAsset, feeType: 'paymentInfo' as const },
    };
    const swap = {
      chain: 'Hydration' as const,
      result: { fee: 2n, asset: dotAsset, feeType: 'paymentInfo' as const },
    };
    const postSwap = {
      chain: 'BridgeHubPolkadot' as const,
      result: { fee: 9n, asset: usdtAsset, feeType: 'paymentInfo' as const },
    };

    vi.mocked(getSwapExecuteXcmFee).mockResolvedValue({
      result: {
        success: true,
        origin: originFee,
        destination: destFee,
        hops: [preSwap, swap, postSwap],
      },
      amountOut: 500n,
    });
    vi.mocked(aggregateHopFees).mockReturnValue({ totalHopFee: 9n, bridgeFee: 9n });

    await getExecuteSwapInfo(dex, baseOptions);

    expect(aggregateHopFees).toHaveBeenCalledWith([postSwap], usdtAsset);
    expect(buildDestInfo).toHaveBeenCalledWith(
      expect.objectContaining({ totalHopFee: 9n, bridgeFee: 9n }),
    );
  });

  it('aggregates over all hops when the exchange chain is not in the hops list', async () => {
    const preSwap = {
      chain: 'AssetHubPolkadot' as const,
      result: { fee: 1n, asset: dotAsset, feeType: 'paymentInfo' as const },
    };
    const otherHop = {
      chain: 'Moonbeam' as const,
      result: { fee: 4n, asset: usdtAsset, feeType: 'paymentInfo' as const },
    };

    vi.mocked(getSwapExecuteXcmFee).mockResolvedValue({
      result: {
        success: true,
        origin: originFee,
        destination: destFee,
        hops: [preSwap, otherHop],
      },
      amountOut: 500n,
    });

    await getExecuteSwapInfo(dex, baseOptions);

    expect(aggregateHopFees).toHaveBeenCalledWith([preSwap, otherHop], usdtAsset);
  });

  it('forwards built hops from buildExecuteSwapHops in the result', async () => {
    const result = await getExecuteSwapInfo(dex, baseOptions);

    expect(buildExecuteSwapHops).toHaveBeenCalledWith({
      api: mockApi,
      hops: [],
      originChain: 'Hydration',
      exchangeChain: 'Hydration',
      currencyFrom: baseOptions.currencyFrom,
      currencyTo: baseOptions.currencyTo,
      sender: 'Alice',
    });
    expect(result.hops).toBe(builtHops);
  });

  it('does not request fallback fees', async () => {
    await getExecuteSwapInfo(dex, baseOptions);

    expect(getSwapExecuteXcmFee).toHaveBeenCalledWith(dex, baseOptions, false);
  });
});
