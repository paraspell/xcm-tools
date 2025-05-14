import type { Trade } from '@crypto-dex-sdk/amm';
import type { Token } from '@crypto-dex-sdk/currency';
import { SwapRouter } from '@crypto-dex-sdk/parachains-bifrost';
import type { Extrinsic } from '@paraspell/sdk-pjs';
import { getBalanceNative, getParaId } from '@paraspell/sdk-pjs';
import type { ApiPromise } from '@polkadot/api';
import BigNumber from 'bignumber.js';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { SmallAmountError } from '../../errors/SmallAmountError';
import type { TSwapOptions } from '../../types';
import BifrostExchangeNode from './BifrostDex';
import { findToken, getBestTrade, getFilteredPairs, getTokenMap } from './utils';

vi.mock('@paraspell/sdk-pjs', async () => {
  const actualModule = await vi.importActual('@paraspell/sdk-pjs');
  return {
    ...actualModule,
    getParaId: vi.fn(),
    getBalanceNative: vi.fn(),
  };
});

vi.mock('./utils', () => ({
  findToken: vi.fn(),
  getBestTrade: vi.fn(),
  getFilteredPairs: vi.fn(),
  getTokenMap: vi.fn(),
  convertAmount: vi.fn(),
}));

vi.mock('@crypto-dex-sdk/parachains-bifrost', () => ({
  SwapRouter: {
    swapCallParameters: vi.fn(),
  },
}));

vi.mock('@crypto-dex-sdk/currency', () => ({
  Amount: {
    fromRawAmount: vi.fn((token: Token, rawAmount: string) => ({
      token,
      rawAmount,
      toFixed: () => rawAmount,
    })),
  },
  Token: vi.fn().mockImplementation((props: { decimals: number; symbol: string }) => ({
    decimals: props.decimals,
    symbol: props.symbol,
  })),
  getCurrencyCombinations: vi.fn(),
}));

vi.mock('@crypto-dex-sdk/math', () => ({
  Percent: vi.fn().mockImplementation((numerator: number, denominator: number) => ({
    numerator,
    denominator,
  })),
}));

vi.mock('../../Logger/Logger', () => ({
  default: {
    log: vi.fn(),
  },
}));

describe('BifrostExchangeNode', () => {
  let node: BifrostExchangeNode;
  const mockApi = {
    derive: {
      chain: {
        bestNumber: vi.fn().mockResolvedValue({ toNumber: () => 100 }),
      },
    },
  } as unknown as ApiPromise;

  beforeEach(() => {
    vi.clearAllMocks();
    node = new BifrostExchangeNode('BifrostPolkadot', 'BifrostPolkadotDex');
    vi.mocked(getBalanceNative).mockResolvedValue(10000000000n);
  });

  describe('swapCurrency', () => {
    const swapOptions = {
      assetFrom: { symbol: 'BNC' },
      assetTo: { symbol: 'KSM' },
      amount: '1000000',
      senderAddress: '5xxxxxx',
      slippagePct: '0.5',
    } as TSwapOptions;
    const mockToDestTransactionFee = new BigNumber('1000');

    beforeEach(() => {
      vi.mocked(getParaId).mockReturnValue(2001);
      vi.mocked(getTokenMap).mockReturnValue({
        BNC: { wrapped: { symbol: 'BNC', decimals: 12 } } as Token,
        KSM: { wrapped: { symbol: 'KSM', decimals: 12 } } as Token,
      });
      vi.mocked(findToken).mockImplementation((tokenMap, symbol) => {
        return tokenMap[symbol];
      });
      vi.mocked(getFilteredPairs).mockResolvedValue([]);
      vi.mocked(getBestTrade).mockReturnValue({
        descriptions: [{ fee: 0.5 }],
        outputAmount: {
          toFixed: () => '500000',
        },
      } as Trade);
      vi.spyOn(SwapRouter, 'swapCallParameters').mockReturnValue({
        extrinsic: [{} as Extrinsic],
      });
    });

    it('should throw an error if currency from token is not found', async () => {
      vi.mocked(findToken).mockImplementationOnce(() => undefined);

      await expect(
        node.swapCurrency(mockApi, swapOptions, mockToDestTransactionFee),
      ).rejects.toThrowError('Currency from not found');
    });

    it('should throw an error if currency to token is not found', async () => {
      vi.mocked(findToken)
        .mockImplementationOnce((tm, symbol) => tm[symbol])
        .mockImplementationOnce(() => undefined);

      await expect(
        node.swapCurrency(mockApi, swapOptions, mockToDestTransactionFee),
      ).rejects.toThrowError('Currency to not found');
    });

    it('should throw an error if extrinsic is null', async () => {
      vi.spyOn(SwapRouter, 'swapCallParameters').mockReturnValue({
        extrinsic: null,
      });

      await expect(
        node.swapCurrency(mockApi, swapOptions, mockToDestTransactionFee),
      ).rejects.toThrowError('Extrinsic is null');
    });

    it('should throw an error if the amount is too small to cover the fees', async () => {
      vi.mocked(getBestTrade).mockReturnValue({
        descriptions: [{ fee: 0.5 }],
        outputAmount: {
          toFixed: () => '-1000000000000',
        },
      } as Trade);

      await expect(
        node.swapCurrency(
          mockApi,
          { ...swapOptions, assetFrom: { symbol: 'KSM' }, assetTo: { symbol: 'BNC' } },
          mockToDestTransactionFee,
        ),
      ).rejects.toThrowError(SmallAmountError);
    });

    it('should return the extrinsic and final amountOut if successful', async () => {
      vi.mocked(getBestTrade)
        .mockReturnValueOnce({
          descriptions: [{ fee: 0.5 }],
          outputAmount: { toFixed: () => '1' },
        } as Trade)
        .mockReturnValueOnce({
          descriptions: [{ fee: 0.5 }],
          outputAmount: { toFixed: () => '1' },
        } as Trade);

      vi.spyOn(SwapRouter, 'swapCallParameters').mockReturnValue({
        extrinsic: [{} as Extrinsic],
      });

      const result = await node.swapCurrency(
        mockApi,
        {
          ...swapOptions,
          amount: '100000000000000',
        },
        mockToDestTransactionFee,
      );

      expect(result.tx).toEqual({});
      expect(result.amountOut).toEqual('1000000000000');
    });
  });

  describe('getAmountOut', () => {
    const swapOptions = {
      assetFrom: { symbol: 'BNC' },
      assetTo: { symbol: 'KSM' },
      amount: '1000000',
    } as TSwapOptions;

    beforeEach(() => {
      vi.mocked(getParaId).mockReturnValue(2001);
      vi.mocked(getTokenMap).mockReturnValue({
        BNC: { wrapped: { symbol: 'BNC', decimals: 12 } } as Token,
        KSM: { wrapped: { symbol: 'KSM', decimals: 12 } } as Token,
      });
      vi.mocked(findToken).mockImplementation((tokenMap, symbol) => {
        return tokenMap[symbol];
      });
      vi.mocked(getFilteredPairs).mockResolvedValue([]);
      vi.mocked(getBestTrade).mockReturnValue({
        descriptions: [{ fee: 0.5 }],
        outputAmount: {
          toFixed: () => '500000',
        },
      } as Trade);
    });

    it('should throw an error if currency from token is not found', async () => {
      vi.mocked(findToken).mockImplementationOnce(() => undefined);

      await expect(node.getAmountOut(mockApi, swapOptions)).rejects.toThrowError(
        'Currency from not found',
      );
    });

    it('should throw an error if currency to token is not found', async () => {
      vi.mocked(findToken)
        .mockImplementationOnce((tm, symbol) => tm[symbol])
        .mockImplementationOnce(() => undefined);

      await expect(node.getAmountOut(mockApi, swapOptions)).rejects.toThrowError(
        'Currency to not found',
      );
    });

    it('should return the amount out', async () => {
      const result = await node.getAmountOut(mockApi, swapOptions);

      expect(result).toEqual(1n);
    });
  });
});
