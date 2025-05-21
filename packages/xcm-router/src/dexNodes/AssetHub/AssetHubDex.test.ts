import {
  getNativeAssetSymbol,
  InvalidParameterError,
  isForeignAsset,
  Parents,
  type TMultiLocation,
} from '@paraspell/sdk-pjs';
import type { ApiPromise } from '@polkadot/api';
import { BigNumber } from 'bignumber.js';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { getExchangeAsset } from '../../assets';
import { SmallAmountError } from '../../errors';
import type { TSingleSwapResult, TSwapOptions } from '../../types';
import AssetHubExchangeNode from './AssetHubDex';
import { getQuotedAmount } from './utils';

vi.mock('./utils', () => ({
  getQuotedAmount: vi.fn(),
  getDexConfig: vi.fn(),
}));

vi.mock('@paraspell/sdk-pjs', async () => {
  const original = await vi.importActual('@paraspell/sdk-pjs');
  return {
    ...original,
    getNativeAssetSymbol: vi.fn(),
    isForeignAsset: vi.fn(),
  };
});

vi.mock('../../consts', () => ({
  DEST_FEE_BUFFER_PCT: 0.02,
  FEE_BUFFER: 1,
}));

vi.mock('../../assets', () => ({
  getExchangeAsset: vi.fn(),
}));

describe('AssetHubExchangeNode', () => {
  it('should be defined', () => {
    expect(true).toBeDefined();
  });

  let instance: AssetHubExchangeNode;
  let api: ApiPromise;
  const dummyTx = { dummy: true };
  const assetFromML: TMultiLocation = { parents: 0, interior: { X1: [{ PalletInstance: 1 }] } };
  const assetToML: TMultiLocation = { parents: 0, interior: { X1: [{ GeneralIndex: 2 }] } };
  const baseSwapOptions = {
    assetFrom: { symbol: 'ASSET1', multiLocation: assetFromML },
    assetTo: { symbol: 'ASSET2', multiLocation: assetToML },
    amount: '1000',
    senderAddress: 'sender',
    slippagePct: '5',
    origin: undefined,
  } as TSwapOptions;

  beforeEach(() => {
    instance = new AssetHubExchangeNode('AssetHubPolkadot', 'AssetHubPolkadotDex');
    api = {
      tx: {
        assetConversion: {
          swapExactTokensForTokens: vi.fn(() => dummyTx),
        },
      },
    } as unknown as ApiPromise;
    vi.clearAllMocks();
  });

  describe('swapCurrency', () => {
    it('should throw if assetFrom.multiLocation is missing', async () => {
      const opts = { ...baseSwapOptions, assetFrom: { symbol: 'ASSET1' } } as TSwapOptions;
      await expect(instance.swapCurrency(api, opts, new BigNumber('50'))).rejects.toThrow(
        'Asset from multiLocation not found',
      );
    });
    it('should throw if assetTo.multiLocation is missing', async () => {
      const opts = { ...baseSwapOptions, assetTo: { symbol: 'ASSET2' } } as TSwapOptions;
      await expect(instance.swapCurrency(api, opts, new BigNumber('50'))).rejects.toThrow(
        'Asset to multiLocation not found',
      );
    });
    it('should throw SmallAmountError if amount is too small', async () => {
      vi.mocked(getQuotedAmount).mockResolvedValueOnce({
        amountOut: BigInt('100'),
        usedFromML: assetFromML,
        usedToML: assetToML,
      });
      vi.mocked(getQuotedAmount).mockResolvedValueOnce({
        amountOut: BigInt('10000000'),
        usedFromML: assetFromML,
        usedToML: assetToML,
      });
      const opts = {
        ...baseSwapOptions,
        assetFrom: { symbol: 'ASSET1', multiLocation: assetFromML },
        assetTo: { symbol: 'NATIVE', multiLocation: assetToML },
        amoun: 1000,
      } as TSwapOptions;
      await expect(instance.swapCurrency(api, opts, new BigNumber('50000'))).rejects.toThrow(
        SmallAmountError,
      );
    });
    it('should swap using native fee conversion when assetTo.symbol equals native asset symbol', async () => {
      const opts = {
        ...baseSwapOptions,
        assetTo: { symbol: 'NATIVE', multiLocation: assetToML },
        origin: {},
      } as TSwapOptions;
      const firstQuote = {
        amountOut: BigInt('2000'),
        usedFromML: assetFromML,
        usedToML: assetToML,
      };
      vi.mocked(getQuotedAmount).mockResolvedValueOnce(firstQuote);
      vi.mocked(getNativeAssetSymbol).mockReturnValue('NATIVE');
      vi.mocked(isForeignAsset).mockReturnValue(false);
      const toDestTxFee = new BigNumber('50');
      const result: TSingleSwapResult = await instance.swapCurrency(api, opts, toDestTxFee);
      expect(api.tx.assetConversion.swapExactTokensForTokens).toHaveBeenCalledWith(
        [assetFromML, assetToML],
        '980',
        BigInt('1900'),
        'sender',
        true,
      );
      expect(result).toEqual({ tx: dummyTx, amountOut: '1950' });
      expect(vi.mocked(getQuotedAmount)).toHaveBeenCalledTimes(1);
    });
    it('should swap using fee conversion via getQuotedAmount when assetTo.symbol is not native', async () => {
      const opts = {
        ...baseSwapOptions,
        assetTo: { symbol: 'NON_NATIVE', multiLocation: assetToML },
        origin: undefined,
      } as TSwapOptions;
      const firstQuote = {
        amountOut: BigInt('2000'),
        usedFromML: assetFromML,
        usedToML: assetToML,
      };
      const feeQuote = {
        amountOut: BigInt('100'),
        usedFromML: { parents: Parents.ONE, interior: { Here: null } },
        usedToML: assetToML,
      };
      vi.mocked(getQuotedAmount).mockResolvedValueOnce(firstQuote).mockResolvedValueOnce(feeQuote);
      vi.mocked(getNativeAssetSymbol).mockReturnValue('NATIVE');
      vi.mocked(isForeignAsset).mockReturnValue(false);
      const toDestTxFee = new BigNumber('50');
      const result: TSingleSwapResult = await instance.swapCurrency(api, opts, toDestTxFee);
      expect(api.tx.assetConversion.swapExactTokensForTokens).toHaveBeenCalledWith(
        [assetFromML, assetToML],
        '1000',
        BigInt('1900'),
        'sender',
        true,
      );
      expect(result).toEqual({ tx: dummyTx, amountOut: '1900' });
      expect(vi.mocked(getQuotedAmount)).toHaveBeenCalledTimes(2);
      expect(vi.mocked(getQuotedAmount).mock.calls[1][0]).toBe(api);
      expect(vi.mocked(getQuotedAmount).mock.calls[1][1]).toEqual({
        parents: Parents.ONE,
        interior: { Here: null },
      });
      expect(vi.mocked(getQuotedAmount).mock.calls[1][3]).toEqual(toDestTxFee);
      expect(vi.mocked(getQuotedAmount).mock.calls[1][4]).toBe(true);
    });
  });

  describe('handleMultiSwap', () => {
    const assetNative = {
      symbol: 'NATIVE',
      multiLocation: { parents: 0, interior: { Here: null } },
    };

    const assetA = {
      symbol: 'A',
      multiLocation: { parents: 0, interior: { X1: [{ PalletInstance: 1 }] } },
    };
    const assetB = {
      symbol: 'B',
      multiLocation: { parents: 0, interior: { X1: [{ GeneralIndex: 2 }] } },
    };

    const baseOpts = {
      amount: '1000',
      senderAddress: 'sender',
      slippagePct: '5',
      origin: undefined,
    };

    beforeEach(() => {
      vi.mocked(getExchangeAsset).mockReturnValue(assetNative);
    });

    it('throws when native asset not found', async () => {
      vi.mocked(getExchangeAsset).mockReturnValue(null);
      await expect(
        instance.handleMultiSwap(
          {} as ApiPromise,
          {
            ...baseOpts,
            assetFrom: assetA,
            assetTo: assetB,
          } as TSwapOptions,
          new BigNumber(0),
        ),
      ).rejects.toThrow(InvalidParameterError);
    });

    it('throws when swapping native asset to itself', async () => {
      await expect(
        instance.handleMultiSwap(
          {} as ApiPromise,
          {
            ...baseOpts,
            assetFrom: assetNative,
            assetTo: assetNative,
          } as TSwapOptions,
          new BigNumber(0),
        ),
      ).rejects.toThrow(InvalidParameterError);
    });

    it('handles single hop when assetFrom is native', async () => {
      instance.swapCurrency = vi.fn().mockResolvedValueOnce({
        tx: dummyTx,
        amountOut: '999',
      });

      const spy = vi.spyOn(instance, 'swapCurrency');

      const result = await instance.handleMultiSwap(
        {} as ApiPromise,
        {
          ...baseOpts,
          assetFrom: assetNative,
          assetTo: assetB,
        } as TSwapOptions,
        new BigNumber(0),
      );

      expect(spy).toHaveBeenCalledTimes(1);
      expect(result).toEqual({ txs: [dummyTx], amountOut: '999' });
    });

    it('handles single hop when assetTo is native', async () => {
      instance.swapCurrency = vi.fn().mockResolvedValueOnce({
        tx: dummyTx,
        amountOut: '888',
      });

      const spy = vi.spyOn(instance, 'swapCurrency');

      const result = await instance.handleMultiSwap(
        {} as ApiPromise,
        {
          ...baseOpts,
          assetFrom: assetA,
          assetTo: assetNative,
        } as TSwapOptions,
        new BigNumber(0),
      );

      expect(spy).toHaveBeenCalledTimes(1);
      expect(result).toEqual({ txs: [dummyTx], amountOut: '888' });
    });

    it('handles multi-hop swap when both assets are non-native', async () => {
      instance.swapCurrency = vi
        .fn()
        .mockResolvedValueOnce({ tx: 'tx1', amountOut: '1000' })
        .mockResolvedValueOnce({ tx: 'tx2', amountOut: '950' });

      const spy = vi.spyOn(instance, 'swapCurrency');

      const result = await instance.handleMultiSwap(
        {} as ApiPromise,
        {
          ...baseOpts,
          assetFrom: assetA,
          assetTo: assetB,
        } as TSwapOptions,
        new BigNumber(0),
      );

      expect(spy).toHaveBeenCalledTimes(2);
      expect(result).toEqual({
        txs: ['tx1', 'tx2'],
        amountOut: '950',
      });
    });

    it('throws if hop 1 returns 0', async () => {
      instance.swapCurrency = vi.fn().mockResolvedValueOnce({ tx: 'tx1', amountOut: '0' });
      await expect(
        instance.handleMultiSwap(
          {} as ApiPromise,
          {
            ...baseOpts,
            assetFrom: assetA,
            assetTo: assetB,
          } as TSwapOptions,
          new BigNumber(0),
        ),
      ).rejects.toThrow(SmallAmountError);
    });

    it('throws if hop 2 returns 0', async () => {
      instance.swapCurrency = vi
        .fn()
        .mockResolvedValueOnce({ tx: 'tx1', amountOut: '1000' })
        .mockResolvedValueOnce({ tx: 'tx2', amountOut: '0' });

      await expect(
        instance.handleMultiSwap(
          {} as ApiPromise,
          {
            ...baseOpts,
            assetFrom: assetA,
            assetTo: assetB,
          } as TSwapOptions,
          new BigNumber(0),
        ),
      ).rejects.toThrow(SmallAmountError);
    });
  });

  describe('getAmountOut', () => {
    it('should throw if assetFrom.multiLocation is missing', async () => {
      const opts = { ...baseSwapOptions, assetFrom: { symbol: 'ASSET1' } } as TSwapOptions;
      await expect(instance.getAmountOut(api, opts)).rejects.toThrow(
        'Asset from multiLocation not found',
      );
    });

    it('should throw if assetTo.multiLocation is missing', async () => {
      const opts = { ...baseSwapOptions, assetTo: { symbol: 'ASSET2' } } as TSwapOptions;
      await expect(instance.getAmountOut(api, opts)).rejects.toThrow(
        'Asset to multiLocation not found',
      );
    });

    it('should return amountOut', async () => {
      const firstQuote = {
        amountOut: BigInt('2000'),
        usedFromML: assetFromML,
        usedToML: assetToML,
      };
      vi.mocked(getQuotedAmount).mockResolvedValueOnce(firstQuote);
      const amountOut = await instance.getAmountOut(api, baseSwapOptions);
      expect(amountOut).toEqual(2000n);
      expect(vi.mocked(getQuotedAmount)).toHaveBeenCalledWith(
        api,
        assetFromML,
        assetToML,
        new BigNumber('1000'),
      );
    });
  });
});
