import type { TPapiApi } from '@paraspell/sdk';
import {
  AmountTooLowError,
  getNativeAssetSymbol,
  InvalidParameterError,
  Parents,
  type TLocation,
  transform,
} from '@paraspell/sdk';
import type { ApiPromise } from '@polkadot/api';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { getExchangeAsset } from '../../assets';
import type { TSingleSwapResult, TSwapOptions } from '../../types';
import AssetHubExchange from './AssetHubExchange';
import { getQuotedAmount } from './utils';

vi.mock('@paraspell/sdk', async () => {
  const original = await vi.importActual('@paraspell/sdk');
  return {
    ...original,
    getNativeAssetSymbol: vi.fn(),
    transform: vi.fn(),
  };
});

vi.mock('./utils');
vi.mock('../../assets');

describe('AssetHubExchange', () => {
  let instance: AssetHubExchange;
  let api: ApiPromise;
  let papiApi: TPapiApi = {} as unknown as TPapiApi;
  const dummyTx = { dummy: true };
  const assetFromML: TLocation = { parents: 0, interior: { X1: [{ PalletInstance: 1 }] } };
  const assetToML: TLocation = { parents: 0, interior: { X1: [{ GeneralIndex: 2 }] } };
  let baseSwapOptions: TSwapOptions;
  const swapMock = vi.fn(() => dummyTx);

  beforeEach(() => {
    vi.clearAllMocks();
    instance = new AssetHubExchange('AssetHubPolkadot', 'AssetHubPolkadotDex');
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
      assetFrom: { symbol: 'ASSET1', decimals: 10, location: assetFromML },
      assetTo: { symbol: 'ASSET2', decimals: 10, location: assetToML },
      amount: 1000n,
      senderAddress: 'sender',
      slippagePct: '5',
      origin: undefined,
    } as TSwapOptions;

    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    vi.mocked(transform).mockImplementation((ml) => ml);
  });

  describe('swapCurrency', () => {
    it('should throw if assetFrom.location is missing', async () => {
      const opts = { ...baseSwapOptions, assetFrom: { symbol: 'ASSET1' } } as TSwapOptions;
      await expect(instance.swapCurrency(api, opts, 50n)).rejects.toThrow(
        'Asset from location not found',
      );
    });

    it('should throw if assetTo.location is missing', async () => {
      const opts = { ...baseSwapOptions, assetTo: { symbol: 'ASSET2' } } as TSwapOptions;
      await expect(instance.swapCurrency(api, opts, 50n)).rejects.toThrow(
        'Asset to location not found',
      );
    });

    it('should throw AmountTooLowError if amount is too small', async () => {
      vi.mocked(getQuotedAmount).mockResolvedValueOnce({
        amountOut: 100n,
        usedFromML: assetFromML,
        usedToML: assetToML,
      });
      vi.mocked(getQuotedAmount).mockResolvedValueOnce({
        amountOut: 10000000n,
        usedFromML: assetFromML,
        usedToML: assetToML,
      });
      const opts = {
        ...baseSwapOptions,
        assetFrom: { symbol: 'ASSET1', decimals: 10, location: assetFromML },
        assetTo: { symbol: 'NATIVE', decimals: 10, location: assetToML },
        amount: 1000n,
      } as TSwapOptions;
      await expect(instance.swapCurrency(api, opts, 50000n)).rejects.toThrow(AmountTooLowError);
    });

    it('should swap using native fee conversion when assetTo.symbol equals native asset symbol', async () => {
      const opts = {
        ...baseSwapOptions,
        assetTo: { symbol: 'NATIVE', location: assetToML },
        origin: {},
      } as TSwapOptions;
      const firstQuote = {
        amountOut: 2000n,
        usedFromML: assetFromML,
        usedToML: assetToML,
      };
      vi.mocked(getQuotedAmount).mockResolvedValueOnce(firstQuote);
      vi.mocked(getNativeAssetSymbol).mockReturnValue('NATIVE');
      const toDestTxFee = 50n;
      const result: TSingleSwapResult = await instance.swapCurrency(api, opts, toDestTxFee);
      expect(swapMock).toHaveBeenCalledWith({
        path: [assetFromML, assetToML],
        amount_in: 990n,
        amount_out_min: 1900n,
        send_to: 'sender',
        keep_alive: true,
      });
      expect(result).toEqual({ tx: dummyTx, amountOut: 1945n });
      expect(getQuotedAmount).toHaveBeenCalledTimes(1);
    });

    it('should swap using fee conversion via getQuotedAmount when assetTo.symbol is not native', async () => {
      const opts = {
        ...baseSwapOptions,
        assetTo: { symbol: 'NON_NATIVE', location: assetToML },
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
      const toDestTxFee = 50n;
      const result: TSingleSwapResult = await instance.swapCurrency(api, opts, toDestTxFee);
      expect(swapMock).toHaveBeenCalledWith({
        path: [assetFromML, assetToML],
        amount_in: 1000n,
        amount_out_min: 1900n,
        send_to: 'sender',
        keep_alive: true,
      });
      expect(result).toEqual({ tx: dummyTx, amountOut: 1890n });
      expect(getQuotedAmount).toHaveBeenCalledTimes(2);

      expect(getQuotedAmount).toHaveBeenCalledWith(
        papiApi,
        instance.chain,
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
      decimals: 12,
      location: { parents: 0, interior: { Here: null } },
    };

    const assetA = {
      symbol: 'A',
      location: { parents: 0, interior: { X1: [{ PalletInstance: 1 }] } },
    };
    const assetB = {
      symbol: 'B',
      location: { parents: 0, interior: { X1: [{ GeneralIndex: 2 }] } },
    };

    const baseOpts = {
      amount: 1000n,
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
          0n,
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
          0n,
        ),
      ).rejects.toThrow(InvalidParameterError);
    });

    it('handles single hop when assetFrom is native', async () => {
      instance.swapCurrency = vi.fn().mockResolvedValueOnce({
        tx: dummyTx,
        amountOut: 999n,
      });

      const spy = vi.spyOn(instance, 'swapCurrency');

      const result = await instance.handleMultiSwap(
        api,
        {
          ...baseOpts,
          assetFrom: assetNative,
          assetTo: assetB,
        } as TSwapOptions,
        0n,
      );

      expect(spy).toHaveBeenCalledTimes(1);
      expect(result).toEqual({ txs: [dummyTx], amountOut: 999n });
    });

    it('handles single hop when assetTo is native', async () => {
      instance.swapCurrency = vi.fn().mockResolvedValueOnce({
        tx: dummyTx,
        amountOut: 888n,
      });

      const spy = vi.spyOn(instance, 'swapCurrency');

      const result = await instance.handleMultiSwap(
        api,
        {
          ...baseOpts,
          assetFrom: assetA,
          assetTo: assetNative,
        } as TSwapOptions,
        0n,
      );

      expect(spy).toHaveBeenCalledTimes(1);
      expect(result).toEqual({ txs: [dummyTx], amountOut: 888n });
    });

    it('handles multi-hop swap when both assets are non-native', async () => {
      instance.swapCurrency = vi
        .fn()
        .mockResolvedValueOnce({ tx: 'tx1', amountOut: 1000n })
        .mockResolvedValueOnce({ tx: 'tx2', amountOut: 950n });

      const spy = vi.spyOn(instance, 'swapCurrency');

      const result = await instance.handleMultiSwap(
        api,
        {
          ...baseOpts,
          assetFrom: assetA,
          assetTo: assetB,
        } as TSwapOptions,
        0n,
      );

      expect(spy).toHaveBeenCalledTimes(2);
      expect(result).toEqual({
        txs: ['tx1', 'tx2'],
        amountOut: 950n,
      });
    });

    it('throws if hop 1 returns 0', async () => {
      instance.swapCurrency = vi.fn().mockResolvedValueOnce({ tx: 'tx1', amountOut: 0n });
      await expect(
        instance.handleMultiSwap(
          api,
          {
            ...baseOpts,
            assetFrom: assetA,
            assetTo: assetB,
          } as TSwapOptions,
          0n,
        ),
      ).rejects.toThrow(AmountTooLowError);
    });

    it('throws if hop 2 returns 0', async () => {
      instance.swapCurrency = vi
        .fn()
        .mockResolvedValueOnce({ tx: 'tx1', amountOut: 1000n })
        .mockResolvedValueOnce({ tx: 'tx2', amountOut: 0n });

      await expect(
        instance.handleMultiSwap(
          api,
          {
            ...baseOpts,
            assetFrom: assetA,
            assetTo: assetB,
          } as TSwapOptions,
          0n,
        ),
      ).rejects.toThrow(AmountTooLowError);
    });
  });

  describe('getAmountOut', () => {
    const assetNative = {
      symbol: 'NATIVE',
      decimals: 12,
      location: { parents: 0, interior: { Here: null } },
    };

    const assetA = {
      symbol: 'A',
      location: { parents: 0, interior: { X1: [{ PalletInstance: 1 }] } },
    };

    const assetB = {
      symbol: 'B',
      location: { parents: 0, interior: { X1: [{ GeneralIndex: 2 }] } },
    };

    beforeEach(() => {
      vi.mocked(getExchangeAsset).mockReturnValue(assetNative);
      vi.mocked(getNativeAssetSymbol).mockReturnValue('NATIVE');
    });

    it('should throw if assetFrom.location is missing', async () => {
      const opts = { ...baseSwapOptions, assetFrom: { symbol: 'ASSET1' } } as TSwapOptions;
      await expect(instance.getAmountOut(api, opts)).rejects.toThrow(
        'Asset from location not found',
      );
    });

    it('should throw if assetTo.location is missing', async () => {
      const opts = { ...baseSwapOptions, assetTo: { symbol: 'ASSET2' } } as TSwapOptions;
      await expect(instance.getAmountOut(api, opts)).rejects.toThrow('Asset to location not found');
    });

    it('should throw when native asset not found', async () => {
      vi.mocked(getExchangeAsset).mockReturnValue(null);
      const opts = {
        ...baseSwapOptions,
        assetFrom: assetA,
        assetTo: assetB,
      } as TSwapOptions;
      await expect(instance.getAmountOut(api, opts)).rejects.toThrow(
        'Native asset not found for this exchange chain.',
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
        amountOut: 2000n,
        usedFromML: assetNative.location,
        usedToML: assetB.location,
      };
      vi.mocked(getQuotedAmount).mockResolvedValueOnce(firstQuote);

      const amountOut = await instance.getAmountOut(api, opts);
      expect(amountOut).toEqual(2000n);
      expect(getQuotedAmount).toHaveBeenCalledTimes(1);
      expect(getQuotedAmount).toHaveBeenCalledWith(
        papiApi,
        instance.chain,
        assetNative.location,
        assetB.location,
        1000n,
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
        amountOut: 2000n,
        usedFromML: assetA.location,
        usedToML: assetNative.location,
      };
      vi.mocked(getQuotedAmount).mockResolvedValueOnce(firstQuote);

      const amountOut = await instance.getAmountOut(api, opts);
      expect(amountOut).toEqual(2000n);
      expect(getQuotedAmount).toHaveBeenCalledTimes(1);
      expect(getQuotedAmount).toHaveBeenCalledWith(
        papiApi,
        instance.chain,
        assetA.location,
        assetNative.location,
        1000n,
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
        amountOut: 2000n,
        usedFromML: assetNative.location,
        usedToML: assetB.location,
      };
      vi.mocked(getQuotedAmount).mockResolvedValueOnce(firstQuote);

      const amountOut = await instance.getAmountOut(api, opts);
      expect(amountOut).toEqual(2000n);
      expect(getQuotedAmount).toHaveBeenCalledWith(
        papiApi,
        instance.chain,
        assetNative.location,
        assetB.location,
        990n,
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
        amountOut: 1000n,
        usedFromML: assetA.location,
        usedToML: assetNative.location,
      };
      const hop2Quote = {
        amountOut: 950n,
        usedFromML: assetNative.location,
        usedToML: assetB.location,
      };

      vi.mocked(getQuotedAmount).mockResolvedValueOnce(hop1Quote).mockResolvedValueOnce(hop2Quote);

      const amountOut = await instance.getAmountOut(api, opts);
      expect(amountOut).toEqual(950n);
      expect(getQuotedAmount).toHaveBeenCalledTimes(2);

      expect(getQuotedAmount).toHaveBeenNthCalledWith(
        1,
        papiApi,
        instance.chain,
        assetA.location,
        assetNative.location,
        1000n,
      );

      expect(getQuotedAmount).toHaveBeenNthCalledWith(
        2,
        papiApi,
        instance.chain,
        assetNative.location,
        assetB.location,
        980n, // 1000 * 0.98
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
        amountOut: 1000n,
        usedFromML: assetA.location,
        usedToML: assetNative.location,
      };
      const hop2Quote = {
        amountOut: 950n,
        usedFromML: assetNative.location,
        usedToML: assetB.location,
      };

      vi.mocked(getQuotedAmount).mockResolvedValueOnce(hop1Quote).mockResolvedValueOnce(hop2Quote);

      const amountOut = await instance.getAmountOut(api, opts);
      expect(amountOut).toEqual(950n);

      expect(getQuotedAmount).toHaveBeenNthCalledWith(
        1,
        papiApi,
        instance.chain,
        assetA.location,
        assetNative.location,
        990n,
      );

      expect(getQuotedAmount).toHaveBeenNthCalledWith(
        2,
        papiApi,
        instance.chain,
        assetNative.location,
        assetB.location,
        980n, // 1000 (hop1Quote.amountOut) * 0.98
      );
    });

    it('should throw AmountTooLowError if first hop returns zero in multi-hop', async () => {
      const opts = {
        ...baseSwapOptions,
        assetFrom: assetA,
        assetTo: assetB,
      } as TSwapOptions;

      const hop1Quote = {
        amountOut: 0n,
        usedFromML: assetA.location,
        usedToML: assetNative.location,
      };

      vi.mocked(getQuotedAmount).mockResolvedValueOnce(hop1Quote);

      await expect(instance.getAmountOut(api, opts)).rejects.toThrow(
        `First hop (${assetA.symbol} -> ${assetNative.symbol}) resulted in zero or negative output.`,
      );
    });

    it('should throw AmountTooLowError if second hop returns zero in multi-hop', async () => {
      const opts = {
        ...baseSwapOptions,
        assetFrom: assetA,
        assetTo: assetB,
      } as TSwapOptions;

      const hop1Quote = {
        amountOut: 1000n,
        usedFromML: assetA.location,
        usedToML: assetNative.location,
      };
      const hop2Quote = {
        amountOut: 0n,
        usedFromML: assetNative.location,
        usedToML: assetB.location,
      };

      vi.mocked(getQuotedAmount).mockResolvedValueOnce(hop1Quote).mockResolvedValueOnce(hop2Quote);

      await expect(instance.getAmountOut(api, opts)).rejects.toThrow(
        `Second hop (${assetNative.symbol} -> ${assetB.symbol}) resulted in zero or negative output.`,
      );
    });

    it('should throw if native asset location is missing in multi-hop', async () => {
      vi.mocked(getExchangeAsset).mockReturnValue({ symbol: 'NATIVE', decimals: 12 });
      const opts = {
        ...baseSwapOptions,
        assetFrom: assetA,
        assetTo: assetB,
      } as TSwapOptions;

      await expect(instance.getAmountOut(api, opts)).rejects.toThrow(
        'Native asset location not found',
      );
    });
  });
});
