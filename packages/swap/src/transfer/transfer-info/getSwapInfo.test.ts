import type {
  PolkadotApi,
  TAssetInfo,
  THopTransferInfo,
  TTransferInfo,
  TXcmFeeDetailSuccess,
} from '@paraspell/sdk-core';
import {
  buildDestInfo,
  buildOriginInfo,
  DryRunFailedError,
  getRelayChainSymbol,
} from '@paraspell/sdk-core';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type ExchangeChain from '../../exchanges/ExchangeChain';
import type { TBuildTransactionsOptions, TTransformedOptions } from '../../types';
import { getSwapFee } from '../fees';
import {
  canUseExecuteTransfer,
  createFromExchangeBuilder,
  createToExchangeBuilder,
  isFilteredError,
  prepareTransformedOptions,
} from '../utils';
import { getExecuteSwapInfo } from './getExecuteSwapInfo';
import { getSwapInfo } from './getSwapInfo';

vi.mock('../fees');
vi.mock('../utils', async (importActual) => ({
  ...(await importActual()),
  validateTransferOptions: vi.fn(),
  prepareTransformedOptions: vi.fn(),
  canUseExecuteTransfer: vi.fn(),
  isFilteredError: vi.fn(),
  createToExchangeBuilder: vi.fn(),
  createFromExchangeBuilder: vi.fn(),
}));
vi.mock('./getExecuteSwapInfo');
vi.mock('@paraspell/sdk-core', async (importActual) => ({
  ...(await importActual()),
  buildOriginInfo: vi.fn(),
  buildDestInfo: vi.fn(),
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

const swapFee: TXcmFeeDetailSuccess = {
  fee: 7n,
  asset: dotAsset,
  feeType: 'paymentInfo',
};

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

const initialOptions = {
  api: mockApi,
} as TBuildTransactionsOptions<unknown, unknown, unknown>;

const buildTransferInfo = (hops: THopTransferInfo[] = []): TTransferInfo => ({
  chain: { origin: 'Acala', destination: 'Hydration', ecosystem: 'Polkadot' },
  origin: {
    selectedCurrency: {
      sufficient: true,
      balance: 100n,
      balanceAfter: 90n,
      asset: acaAsset,
    },
    xcmFee: {
      fee: 1n,
      asset: acaAsset,
      sufficient: true,
      balance: 100n,
      balanceAfter: 99n,
    },
  },
  hops,
  destination: {
    receivedCurrency: {
      sufficient: true,
      receivedAmount: 50n,
      balance: 0n,
      balanceAfter: 50n,
      asset: usdtAsset,
    },
    xcmFee: { fee: 0n, asset: usdtAsset, balanceAfter: 0n },
  },
});

const createBuilderMock = (info: TTransferInfo) =>
  ({ getTransferInfo: vi.fn().mockResolvedValue(info) }) as unknown as ReturnType<
    typeof createToExchangeBuilder<unknown, unknown, unknown>
  >;

describe('getSwapInfo', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(prepareTransformedOptions).mockResolvedValue({ options: baseOptions, dex });
    vi.mocked(canUseExecuteTransfer).mockReturnValue(false);
    vi.mocked(isFilteredError).mockReturnValue(false);
    vi.mocked(getRelayChainSymbol).mockReturnValue('Polkadot');
    vi.mocked(getSwapFee).mockResolvedValue({ result: swapFee, amountOut: 500n });
    vi.mocked(buildOriginInfo).mockResolvedValue({
      selectedCurrency: [
        {
          sufficient: true,
          balance: 100n,
          balanceAfter: 90n,
          asset: acaAsset,
        },
      ],
      xcmFee: {
        fee: 1n,
        asset: acaAsset,
        sufficient: true,
        balance: 100n,
        balanceAfter: 99n,
      },
    });
    vi.mocked(buildDestInfo).mockResolvedValue({
      receivedCurrency: {
        sufficient: true,
        receivedAmount: 50n,
        balance: 0n,
        balanceAfter: 50n,
        asset: usdtAsset,
      },
      xcmFee: { fee: 0n, asset: usdtAsset, balance: 0n, balanceAfter: 0n },
    });
  });

  describe('execute transfer path', () => {
    it('returns getExecuteSwapInfo result when execute transfer is usable', async () => {
      const expected = buildTransferInfo();
      vi.mocked(canUseExecuteTransfer).mockReturnValue(true);
      vi.mocked(getExecuteSwapInfo).mockResolvedValue(expected);

      const result = await getSwapInfo(initialOptions);

      expect(result).toBe(expected);
      expect(getExecuteSwapInfo).toHaveBeenCalledWith(dex, baseOptions);
      expect(getSwapFee).not.toHaveBeenCalled();
    });

    it('falls back to routed path on filtered error', async () => {
      vi.mocked(canUseExecuteTransfer).mockReturnValue(true);
      vi.mocked(getExecuteSwapInfo).mockRejectedValue(new DryRunFailedError('Filtered', 'origin'));
      vi.mocked(isFilteredError).mockReturnValue(true);

      const result = await getSwapInfo(initialOptions);

      expect(getSwapFee).toHaveBeenCalled();
      expect(result.chain.ecosystem).toBe('Polkadot');
    });

    it('rethrows non-filtered error from getExecuteSwapInfo', async () => {
      vi.mocked(canUseExecuteTransfer).mockReturnValue(true);
      const err = new Error('boom');
      vi.mocked(getExecuteSwapInfo).mockRejectedValue(err);
      vi.mocked(isFilteredError).mockReturnValue(false);

      await expect(getSwapInfo(initialOptions)).rejects.toBe(err);
      expect(getSwapFee).not.toHaveBeenCalled();
    });
  });

  describe('routed path', () => {
    it('builds exchange origin and destination when neither origin nor destination given', async () => {
      const result = await getSwapInfo(initialOptions);

      expect(buildOriginInfo).toHaveBeenCalledWith(
        expect.objectContaining({
          origin: 'Hydration',
          sender: 'Alice',
          amount: 1000n,
          originFee: swapFee.fee,
        }),
      );
      expect(buildDestInfo).toHaveBeenCalledWith(
        expect.objectContaining({
          destination: 'Hydration',
          recipient: 'Alice',
          currency: expect.objectContaining({ amount: 500n, symbol: 'USDT' }),
        }),
      );
      expect(result.origin.isExchange).toBe(true);
      expect(result.destination.isExchange).toBe(true);
      expect(result.hops).toEqual([]);
    });

    it('uses evmSenderAddress when present for buildExchangeOriginInfo', async () => {
      vi.mocked(prepareTransformedOptions).mockResolvedValue({
        options: { ...baseOptions, evmSenderAddress: '0xEvm' },
        dex,
      });

      await getSwapInfo(initialOptions);

      expect(buildOriginInfo).toHaveBeenCalledWith(expect.objectContaining({ sender: '0xEvm' }));
    });

    it('uses sendingInfo and adds exchange hop when both origin and destination differ from exchange', async () => {
      const sendingHop: THopTransferInfo = {
        chain: 'AssetHubPolkadot',
        result: { xcmFee: { fee: 2n, asset: dotAsset }, asset: dotAsset },
      };
      const receivingHop: THopTransferInfo = {
        chain: 'AssetHubPolkadot',
        result: { xcmFee: { fee: 3n, asset: usdtAsset }, asset: usdtAsset },
      };
      const sendingInfo = buildTransferInfo([sendingHop]);
      const receivingInfo = buildTransferInfo([receivingHop]);

      vi.mocked(createToExchangeBuilder).mockReturnValue(createBuilderMock(sendingInfo));
      vi.mocked(createFromExchangeBuilder).mockReturnValue(createBuilderMock(receivingInfo));

      vi.mocked(prepareTransformedOptions).mockResolvedValue({
        options: {
          ...baseOptions,
          origin: {
            api: mockApi,
            chain: 'Acala',
            assetFrom: acaAsset,
          },
          destination: { chain: 'Moonbeam', address: 'Carol' },
        },
        dex,
      });

      const result = await getSwapInfo(initialOptions);

      expect(createToExchangeBuilder).toHaveBeenCalled();
      expect(createFromExchangeBuilder).toHaveBeenCalledWith(
        expect.objectContaining({ amount: 500n }),
      );
      expect(result.origin).toEqual(sendingInfo.origin);
      expect(result.destination).toEqual(receivingInfo.destination);
      expect(result.chain).toEqual({
        origin: 'Acala',
        destination: 'Moonbeam',
        ecosystem: 'Polkadot',
      });
      expect(result.hops).toEqual([
        sendingHop,
        {
          chain: 'Hydration',
          result: {
            asset: usdtAsset,
            xcmFee: { fee: swapFee.fee + receivingInfo.origin.xcmFee.fee, asset: dotAsset },
            isExchange: true,
          },
        },
        receivingHop,
      ]);
    });

    it('skips sendingInfo when origin chain equals exchange chain', async () => {
      vi.mocked(prepareTransformedOptions).mockResolvedValue({
        options: {
          ...baseOptions,
          origin: {
            api: mockApi,
            chain: 'Hydration',
            assetFrom: dotAsset,
          },
        },
        dex,
      });

      const result = await getSwapInfo(initialOptions);

      expect(createToExchangeBuilder).not.toHaveBeenCalled();
      expect(buildOriginInfo).toHaveBeenCalled();
      expect(result.origin.isExchange).toBe(true);
      expect(result.chain.origin).toBe('Hydration');
    });
  });
});
