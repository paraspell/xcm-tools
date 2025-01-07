import { describe, it, expect, beforeEach, vi } from 'vitest';
import BigNumber from 'bignumber.js';
import { SmallAmountError } from '../../errors/SmallAmountError';
import type { Extrinsic } from '@paraspell/sdk-pjs';
import { getParaId } from '@paraspell/sdk-pjs';
import { convertAmount, findToken, getBestTrade, getFilteredPairs, getTokenMap } from './utils';
import { SwapRouter } from '@crypto-dex-sdk/parachains-bifrost';
import type { ApiPromise } from '@polkadot/api';
import type { TSwapOptions } from '../../types';
import type { Token } from '@crypto-dex-sdk/currency';
import BifrostExchangeNode from './BifrostDex';
import type { Trade } from '@crypto-dex-sdk/amm';

vi.mock('@paraspell/sdk-pjs', () => ({
  getParaId: vi.fn(),
}));

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
  Token: vi.fn().mockImplementation((props: { decimals: number }) => ({
    decimals: props.decimals,
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
  });

  describe('getAssets', () => {
    it('should return a list of assets from the token map', async () => {
      vi.mocked(getParaId).mockReturnValueOnce(2001);
      vi.mocked(getTokenMap).mockReturnValueOnce({
        BNC: { wrapped: { symbol: 'BNC', decimals: 12 } } as Token,
        KSM: { wrapped: { symbol: 'KSM', decimals: 12 } } as Token,
      });

      const result = await node.getAssets(mockApi);

      expect(getParaId).toHaveBeenCalledWith('BifrostPolkadot');
      expect(result).toEqual([{ symbol: 'BNC' }, { symbol: 'KSM' }]);
    });
  });

  describe('swapCurrency', () => {
    const swapOptions = {
      assetFrom: { symbol: 'BNC' },
      assetTo: { symbol: 'KSM' },
      currencyFrom: { symbol: 'BNC' },
      currencyTo: { symbol: 'KSM' },
      amount: '1000000',
      injectorAddress: '5xxxxxx',
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
      vi.mocked(convertAmount).mockImplementation((bn: BigNumber) => new BigNumber(bn.toString()));
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

    it('should throw a SmallAmountError if amountWithoutFee is negative', async () => {
      vi.mocked(convertAmount).mockReturnValue(new BigNumber('2000000'));

      await expect(
        node.swapCurrency(mockApi, swapOptions, mockToDestTransactionFee),
      ).rejects.toThrowError(SmallAmountError);
    });

    it('should throw a SmallAmountError if amountWithoutSwapFee is negative', async () => {
      vi.mocked(convertAmount).mockReturnValue(new BigNumber('0'));
      vi.mocked(getBestTrade).mockReturnValue({
        descriptions: [{ fee: 100 }],
        outputAmount: { toFixed: () => '0' },
      } as Trade);

      await expect(
        node.swapCurrency(mockApi, swapOptions, mockToDestTransactionFee),
      ).rejects.toThrowError(SmallAmountError);
    });

    it('should throw an error if extrinsic is null', async () => {
      vi.spyOn(SwapRouter, 'swapCallParameters').mockReturnValue({
        extrinsic: null,
      });

      await expect(
        node.swapCurrency(mockApi, swapOptions, mockToDestTransactionFee),
      ).rejects.toThrowError('Extrinsic is null');
    });

    it('should throw a SmallAmountError if final output after fees is negative', async () => {
      vi.mocked(getBestTrade).mockReturnValueOnce({
        descriptions: [{ fee: 0.5 }],
        outputAmount: { toFixed: () => '500000' },
      } as Trade);
      vi.mocked(getBestTrade).mockReturnValueOnce({
        descriptions: [{ fee: 0.5 }],
        outputAmount: { toFixed: () => '400000' },
      } as Trade);

      vi.mocked(convertAmount)
        .mockReturnValueOnce(new BigNumber('1000000'))
        .mockReturnValueOnce(new BigNumber('6000000'));

      await expect(
        node.swapCurrency(mockApi, swapOptions, mockToDestTransactionFee),
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

      vi.mocked(convertAmount)
        .mockReturnValueOnce(new BigNumber('1'))
        .mockReturnValueOnce(new BigNumber('1'))
        .mockReturnValue(new BigNumber('1'));

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
      expect(result.amountOut).toEqual('399999999999999999');
    });
  });
});
