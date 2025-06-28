import type { TPapiApi } from '@paraspell/sdk';
import {
  getNativeAssetSymbol,
  InvalidParameterError,
  isForeignAsset,
  Parents,
  type TMultiLocation,
  transform,
} from '@paraspell/sdk';
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

vi.mock('@paraspell/sdk', async () => {
  const original = await vi.importActual('@paraspell/sdk');
  return {
    ...original,
    getNativeAssetSymbol: vi.fn(),
    isForeignAsset: vi.fn(),
    transform: vi.fn(),
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
  let papiApi: TPapiApi = {} as unknown as TPapiApi;
  const dummyTx = { dummy: true };
  const assetFromML: TMultiLocation = { parents: 0, interior: { X1: [{ PalletInstance: 1 }] } };
  const assetToML: TMultiLocation = { parents: 0, interior: { X1: [{ GeneralIndex: 2 }] } };
  let baseSwapOptions: TSwapOptions;
  const swapMock = vi.fn(() => dummyTx);

  beforeEach(() => {
    vi.clearAllMocks();
    instance = new AssetHubExchangeNode('AssetHubPolkadot', 'AssetHubPolkadotDex');
    api = {} as unknown as ApiPromise;
    papiApi = {
      getUnsafeApi: () => ({
        tx: {
          AssetConversion: {
            swap_exact_tokens_for_tokens: swapMock,
          },
        },
      }),
    } as unknown as TPapiApi;

    baseSwapOptions = {
      papiApi: papiApi,
      assetFrom: { symbol: 'ASSET1', multiLocation: assetFromML },
      assetTo: { symbol: 'ASSET2', multiLocation: assetToML },
      amount: '1000',
      senderAddress: 'sender',
      slippagePct: '5',
      origin: undefined,
    } as TSwapOptions;

    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    vi.mocked(transform).mockImplementation((ml) => ml);
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
      await expect(instance.swapCurrency(api, opts, BigNumber('50000'))).rejects.toThrow(
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
      const toDestTxFee = BigNumber('50');
      const result: TSingleSwapResult = await instance.swapCurrency(api, opts, toDestTxFee);
      expect(swapMock).toHaveBeenCalledWith({
        path: [assetFromML, assetToML],
        amount_in: 980n,
        amount_out_min: 1900n,
        send_to: 'sender',
        keep_alive: true,
      });
      expect(result).toEqual({ tx: dummyTx, amountOut: '1950' });
      expect(getQuotedAmount).toHaveBeenCalledTimes(1);
    });

    it('should swap using fee conversion via getQuotedAmount when assetTo.symbol is not native', async () => {
      const opts = {
        ...baseSwapOptions,
        assetTo: { symbol: 'NON_NATIVE', multiLocation: assetToML },
        origin: undefined,
      } as TSwapOptions;
      const firstQuote = {
        amountOut: 2000n,
        usedFromML: assetFromML,
        usedToML: assetToML,
      };
      const feeQuote = {
        amountOut: 100n,
        usedFromML: { parents: Parents.ONE, interior: { Here: null } },
        usedToML: assetToML,
      };
      vi.mocked(getQuotedAmount).mockResolvedValueOnce(firstQuote).mockResolvedValueOnce(feeQuote);
      vi.mocked(getNativeAssetSymbol).mockReturnValue('NATIVE');
      vi.mocked(isForeignAsset).mockReturnValue(false);
      const toDestTxFee = BigNumber('50');
      const result: TSingleSwapResult = await instance.swapCurrency(api, opts, toDestTxFee);
      expect(swapMock).toHaveBeenCalledWith({
        path: [assetFromML, assetToML],
        amount_in: 1000n,
        amount_out_min: 1900n,
        send_to: 'sender',
        keep_alive: true,
      });
      expect(result).toEqual({ tx: dummyTx, amountOut: '1900' });
      expect(getQuotedAmount).toHaveBeenCalledTimes(2);

      expect(getQuotedAmount).toHaveBeenCalledWith(
        papiApi,
        instance.node,
        {
          parents: Parents.ONE,
          interior: { Here: null },
        },
        assetToML,
        toDestTxFee,
        true,
      );
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
          api,
          {
            ...baseOpts,
            assetFrom: assetA,
            assetTo: assetB,
          } as TSwapOptions,
          BigNumber(0),
        ),
      ).rejects.toThrow(InvalidParameterError);
    });

    it('throws when swapping native asset to itself', async () => {
      await expect(
        instance.handleMultiSwap(
          api,
          {
            ...baseOpts,
            assetFrom: assetNative,
            assetTo: assetNative,
          } as TSwapOptions,
          BigNumber(0),
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
        api,
        {
          ...baseOpts,
          assetFrom: assetNative,
          assetTo: assetB,
        } as TSwapOptions,
        BigNumber(0),
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
        api,
        {
          ...baseOpts,
          assetFrom: assetA,
          assetTo: assetNative,
        } as TSwapOptions,
        BigNumber(0),
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
        api,
        {
          ...baseOpts,
          assetFrom: assetA,
          assetTo: assetB,
        } as TSwapOptions,
        BigNumber(0),
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
          api,
          {
            ...baseOpts,
            assetFrom: assetA,
            assetTo: assetB,
          } as TSwapOptions,
          BigNumber(0),
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
          api,
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

    beforeEach(() => {
      vi.mocked(getExchangeAsset).mockReturnValue(assetNative);
      vi.mocked(getNativeAssetSymbol).mockReturnValue('NATIVE');
    });

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

    it('should throw when native asset not found', async () => {
      vi.mocked(getExchangeAsset).mockReturnValue(null);
      const opts = {
        ...baseSwapOptions,
        assetFrom: assetA,
        assetTo: assetB,
      } as TSwapOptions;
      await expect(instance.getAmountOut(api, opts)).rejects.toThrow(
        'Native asset not found for this exchange node.',
      );
    });

    it('should throw when swapping native asset to itself', async () => {
      const opts = {
        ...baseSwapOptions,
        assetFrom: assetNative,
        assetTo: assetNative,
      } as TSwapOptions;
      await expect(instance.getAmountOut(api, opts)).rejects.toThrow(
        'Cannot swap native asset to itself.',
      );
    });

    it('should return amountOut for single hop when assetFrom is native', async () => {
      const opts = {
        ...baseSwapOptions,
        assetFrom: assetNative,
        assetTo: assetB,
        origin: undefined,
      } as TSwapOptions;

      const firstQuote = {
        amountOut: BigInt('2000'),
        usedFromML: assetNative.multiLocation,
        usedToML: assetB.multiLocation,
      };
      vi.mocked(getQuotedAmount).mockResolvedValueOnce(firstQuote);

      const amountOut = await instance.getAmountOut(api, opts);
      expect(amountOut).toEqual(2000n);
      expect(getQuotedAmount).toHaveBeenCalledTimes(1);
      expect(getQuotedAmount).toHaveBeenCalledWith(
        papiApi,
        instance.node,
        assetNative.multiLocation,
        assetB.multiLocation,
        BigNumber('1000'),
      );
    });

    it('should return amountOut for single hop when assetTo is native', async () => {
      const opts = {
        ...baseSwapOptions,
        assetFrom: assetA,
        assetTo: assetNative,
        origin: undefined,
      } as TSwapOptions;

      const firstQuote = {
        amountOut: BigInt('2000'),
        usedFromML: assetA.multiLocation,
        usedToML: assetNative.multiLocation,
      };
      vi.mocked(getQuotedAmount).mockResolvedValueOnce(firstQuote);

      const amountOut = await instance.getAmountOut(api, opts);
      expect(amountOut).toEqual(2000n);
      expect(getQuotedAmount).toHaveBeenCalledTimes(1);
      expect(getQuotedAmount).toHaveBeenCalledWith(
        papiApi,
        instance.node,
        assetA.multiLocation,
        assetNative.multiLocation,
        BigNumber('1000'),
      );
    });

    it('should return amountOut for single hop with origin fee deduction', async () => {
      const opts = {
        ...baseSwapOptions,
        assetFrom: assetNative,
        assetTo: assetB,
        origin: {},
      } as TSwapOptions;

      const firstQuote = {
        amountOut: BigInt('2000'),
        usedFromML: assetNative.multiLocation,
        usedToML: assetB.multiLocation,
      };
      vi.mocked(getQuotedAmount).mockResolvedValueOnce(firstQuote);

      const amountOut = await instance.getAmountOut(api, opts);
      expect(amountOut).toEqual(2000n);
      expect(getQuotedAmount).toHaveBeenCalledWith(
        papiApi,
        instance.node,
        assetNative.multiLocation,
        assetB.multiLocation,
        BigNumber('980'), // 1000 * (1 - 0.02)
      );
    });

    it('should handle multi-hop swap when both assets are non-native', async () => {
      const opts = {
        ...baseSwapOptions,
        assetFrom: assetA,
        assetTo: assetB,
        origin: undefined,
      } as TSwapOptions;

      const hop1Quote = {
        amountOut: BigInt('1000'),
        usedFromML: assetA.multiLocation,
        usedToML: assetNative.multiLocation,
      };
      const hop2Quote = {
        amountOut: BigInt('950'),
        usedFromML: assetNative.multiLocation,
        usedToML: assetB.multiLocation,
      };

      vi.mocked(getQuotedAmount).mockResolvedValueOnce(hop1Quote).mockResolvedValueOnce(hop2Quote);

      const amountOut = await instance.getAmountOut(api, opts);
      expect(amountOut).toEqual(950n);
      expect(getQuotedAmount).toHaveBeenCalledTimes(2);

      expect(getQuotedAmount).toHaveBeenNthCalledWith(
        1,
        papiApi,
        instance.node,
        assetA.multiLocation,
        assetNative.multiLocation,
        BigNumber('1000'),
      );

      expect(getQuotedAmount).toHaveBeenNthCalledWith(
        2,
        papiApi,
        instance.node,
        assetNative.multiLocation,
        assetB.multiLocation,
        BigNumber('980'), // 1000 * 0.98
      );
    });

    it('should handle multi-hop swap with origin fee deduction', async () => {
      const opts = {
        ...baseSwapOptions,
        assetFrom: assetA,
        assetTo: assetB,
        origin: {},
      } as TSwapOptions;

      const hop1Quote = {
        amountOut: BigInt('1000'),
        usedFromML: assetA.multiLocation,
        usedToML: assetNative.multiLocation,
      };
      const hop2Quote = {
        amountOut: BigInt('950'),
        usedFromML: assetNative.multiLocation,
        usedToML: assetB.multiLocation,
      };

      vi.mocked(getQuotedAmount).mockResolvedValueOnce(hop1Quote).mockResolvedValueOnce(hop2Quote);

      const amountOut = await instance.getAmountOut(api, opts);
      expect(amountOut).toEqual(950n);

      expect(getQuotedAmount).toHaveBeenNthCalledWith(
        1,
        papiApi,
        instance.node,
        assetA.multiLocation,
        assetNative.multiLocation,
        BigNumber('980'), // 1000 * (1 - 0.02)
      );

      expect(getQuotedAmount).toHaveBeenNthCalledWith(
        2,
        papiApi,
        instance.node,
        assetNative.multiLocation,
        assetB.multiLocation,
        BigNumber('980'), // 1000 (hop1Quote.amountOut) * 0.98
      );
    });

    it('should throw SmallAmountError if first hop returns zero in multi-hop', async () => {
      const opts = {
        ...baseSwapOptions,
        assetFrom: assetA,
        assetTo: assetB,
      } as TSwapOptions;

      const hop1Quote = {
        amountOut: BigInt('0'),
        usedFromML: assetA.multiLocation,
        usedToML: assetNative.multiLocation,
      };

      vi.mocked(getQuotedAmount).mockResolvedValueOnce(hop1Quote);

      await expect(instance.getAmountOut(api, opts)).rejects.toThrow(
        `First hop (${assetA.symbol} -> ${assetNative.symbol}) resulted in zero or negative output.`,
      );
    });

    it('should throw SmallAmountError if second hop returns zero in multi-hop', async () => {
      const opts = {
        ...baseSwapOptions,
        assetFrom: assetA,
        assetTo: assetB,
      } as TSwapOptions;

      const hop1Quote = {
        amountOut: BigInt('1000'),
        usedFromML: assetA.multiLocation,
        usedToML: assetNative.multiLocation,
      };
      const hop2Quote = {
        amountOut: BigInt('0'),
        usedFromML: assetNative.multiLocation,
        usedToML: assetB.multiLocation,
      };

      vi.mocked(getQuotedAmount).mockResolvedValueOnce(hop1Quote).mockResolvedValueOnce(hop2Quote);

      await expect(instance.getAmountOut(api, opts)).rejects.toThrow(
        `Second hop (${assetNative.symbol} -> ${assetB.symbol}) resulted in zero or negative output.`,
      );
    });

    it('should throw if native asset multiLocation is missing in multi-hop', async () => {
      vi.mocked(getExchangeAsset).mockReturnValue({ symbol: 'NATIVE' });
      const opts = {
        ...baseSwapOptions,
        assetFrom: assetA,
        assetTo: assetB,
      } as TSwapOptions;

      await expect(instance.getAmountOut(api, opts)).rejects.toThrow(
        'Native asset multiLocation not found',
      );
    });
  });
});
