import type { TAssetInfo, TParachain } from '@paraspell/sdk';
import { applyDecimalAbstraction, findAssetInfo, hasSupportForAsset } from '@paraspell/sdk';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { getExchangeAsset, getExchangeAssetByOriginAsset } from '../assets';
import type ExchangeChain from '../exchanges/ExchangeChain';
import { createExchangeInstance } from '../exchanges/ExchangeChainFactory';
import Logger from '../Logger/Logger';
import type { TCommonRouterOptions, TExchangeChain } from '../types';
import { selectBestExchangeCommon } from './selectBestExchangeCommon';

vi.mock('@paraspell/sdk', () => ({
  findAssetInfo: vi.fn(),
  hasSupportForAsset: vi.fn(),
  getRelayChainOf: vi.fn(),
  applyDecimalAbstraction: vi.fn(),
  RoutingResolutionError: class extends Error {},
  UnsupportedOperationError: class extends Error {},
}));

vi.mock('../assets');
vi.mock('../exchanges/ExchangeChainFactory');

vi.mock('./canBuildToExchangeTx', () => ({
  canBuildToExchangeTx: vi.fn().mockResolvedValue({ success: true }),
}));

vi.spyOn(Logger, 'log').mockImplementation(() => {});

const baseOptions = {
  from: 'originDex',
  to: 'destDex',
  currencyFrom: { symbol: 'AAA' },
  currencyTo: { symbol: 'BBB' },
} as unknown as TCommonRouterOptions;

describe('selectBestExchangeCommon', () => {
  beforeEach(() => {
    vi.mocked(applyDecimalAbstraction).mockImplementation((amount) =>
      amount ? (amount as bigint) : 0n,
    );
    vi.clearAllMocks();
  });

  it('throws error if assetFromOrigin is not found', async () => {
    vi.mocked(findAssetInfo).mockReturnValue(null);
    await expect(
      selectBestExchangeCommon(baseOptions, undefined, () => Promise.resolve(0n)),
    ).rejects.toThrow(
      `Currency from ${JSON.stringify(baseOptions.currencyFrom)} not found in ${baseOptions.from}.`,
    );
  });

  it('throws error if currencyTo is specified by id', async () => {
    const options = { ...baseOptions, currencyTo: { id: 'some-id' } };
    vi.mocked(findAssetInfo).mockReturnValue({ symbol: 'AAA' } as TAssetInfo);
    await expect(
      selectBestExchangeCommon(options, undefined, () => Promise.resolve(0n)),
    ).rejects.toThrow(
      'Cannot select currencyTo by ID when auto-selecting is enabled. Please specify currencyTo by symbol or location.',
    );
  });

  it('returns best exchange if one qualifies', async () => {
    vi.mocked(findAssetInfo).mockReturnValue({ symbol: 'AAA' } as TAssetInfo);
    vi.mocked(getExchangeAssetByOriginAsset).mockReturnValue({ symbol: 'AAA', decimals: 8 });
    vi.mocked(getExchangeAsset).mockReturnValue({ symbol: 'BBB', decimals: 8 });
    vi.mocked(hasSupportForAsset).mockReturnValue(true);

    const fakeDex1 = { chain: 'ex1', exchangeChain: 'ex1Ex' } as unknown as ExchangeChain;
    const fakeDex2 = { chain: 'ex2', exchangeChain: 'ex2Ex' } as unknown as ExchangeChain;

    vi.mocked(createExchangeInstance).mockImplementation((exchangeChain) => {
      return exchangeChain === ('ex1' as TExchangeChain) ? fakeDex1 : fakeDex2;
    });

    const computeAmountOut = (dex: ExchangeChain) => {
      if (dex.chain === ('ex1' as TParachain)) return Promise.resolve(100n);
      if (dex.chain === ('ex2' as TParachain)) return Promise.resolve(200n);
      return Promise.resolve(0n);
    };

    const originApi = undefined;

    const bestExchange = await selectBestExchangeCommon(baseOptions, originApi, computeAmountOut);
    expect(bestExchange).toBe(fakeDex2);
  });

  it('throws error if no exchange qualifies (assets not found)', async () => {
    vi.mocked(findAssetInfo).mockReturnValue({ symbol: 'AAA' } as TAssetInfo);
    vi.mocked(getExchangeAssetByOriginAsset).mockReturnValue(undefined);
    vi.mocked(getExchangeAsset).mockReturnValue(null);

    const fakeDex = { chain: 'ex1', exchangeChain: 'ex1Ex' } as unknown as ExchangeChain;
    vi.mocked(createExchangeInstance).mockReturnValue(fakeDex);

    await expect(
      selectBestExchangeCommon(baseOptions, undefined, () => Promise.resolve(0n)),
    ).rejects.toThrow();
  });

  it('throws error with aggregated errors if computeAmountOut fails for all exchanges', async () => {
    vi.mocked(findAssetInfo).mockReturnValue({ symbol: 'AAA' } as TAssetInfo);
    vi.mocked(getExchangeAssetByOriginAsset).mockReturnValue({ symbol: 'AAA', decimals: 8 });
    vi.mocked(getExchangeAsset).mockReturnValue({ symbol: 'BBB', decimals: 8 });
    vi.mocked(hasSupportForAsset).mockReturnValue(true);

    const fakeDex1 = { chain: 'ex1', exchangeChain: 'ex1Ex' } as unknown as ExchangeChain;
    const fakeDex2 = { chain: 'ex2', exchangeChain: 'ex2Ex' } as unknown as ExchangeChain;

    vi.mocked(createExchangeInstance).mockImplementation((exchangeChain) => {
      return exchangeChain === ('ex1' as TExchangeChain) ? fakeDex1 : fakeDex2;
    });

    const error1 = new Error('Error from ex1');
    const error2 = new Error('Error from ex2');
    const computeAmountOut = (dex: ExchangeChain) => {
      if (dex.chain === ('ex1' as TParachain)) throw error1;
      if (dex.chain === ('ex2' as TParachain)) throw error2;
      return Promise.resolve(0n);
    };

    await expect(
      selectBestExchangeCommon(baseOptions, undefined, computeAmountOut),
    ).rejects.toThrow();
  });

  it('uses getExchangeAsset when from is not specified', async () => {
    const optionsWithoutFrom = {
      ...baseOptions,
      from: undefined,
      exchange: ['AcalaDex'],
    } as unknown as TCommonRouterOptions;

    vi.mocked(getExchangeAsset).mockReturnValueOnce({ symbol: 'AAA', decimals: 8 });
    vi.mocked(getExchangeAsset).mockReturnValueOnce({ symbol: 'BBB', decimals: 8 });
    vi.mocked(hasSupportForAsset).mockReturnValue(true);

    const fakeDex = { chain: 'Acala', exchangeChain: 'AcalaDex' } as unknown as ExchangeChain;
    vi.mocked(createExchangeInstance).mockReturnValue(fakeDex);

    const computeAmountOut = vi.fn().mockResolvedValue(100n);

    const bestExchange = await selectBestExchangeCommon(
      optionsWithoutFrom,
      undefined,
      computeAmountOut,
    );

    expect(bestExchange).toBe(fakeDex);
    expect(getExchangeAsset).toHaveBeenCalledWith('AcalaDex', optionsWithoutFrom.currencyFrom);
  });

  it('uses getExchangeAsset when from equals dex.chain', async () => {
    const optionsWithSameChain = {
      ...baseOptions,
      from: 'Acala',
      exchange: ['AcalaDex'],
    } as unknown as TCommonRouterOptions;

    vi.mocked(findAssetInfo).mockReturnValue({ symbol: 'AAA' } as TAssetInfo);
    vi.mocked(getExchangeAsset).mockReturnValueOnce({ symbol: 'AAA', decimals: 8 });
    vi.mocked(getExchangeAsset).mockReturnValueOnce({ symbol: 'BBB', decimals: 8 });
    vi.mocked(hasSupportForAsset).mockReturnValue(true);

    const fakeDex = { chain: 'Acala', exchangeChain: 'AcalaDex' } as unknown as ExchangeChain;
    vi.mocked(createExchangeInstance).mockReturnValue(fakeDex);

    const computeAmountOut = vi.fn().mockResolvedValue(100n);

    const bestExchange = await selectBestExchangeCommon(
      optionsWithSameChain,
      undefined,
      computeAmountOut,
    );

    expect(bestExchange).toBe(fakeDex);
    expect(getExchangeAsset).toHaveBeenCalledWith('AcalaDex', optionsWithSameChain.currencyFrom);
  });

  it('throws RoutingResolutionError with clear message if assetFromExchange is missing', async () => {
    vi.mocked(findAssetInfo).mockReturnValue({ symbol: 'AAA' } as TAssetInfo);
    vi.mocked(getExchangeAssetByOriginAsset).mockReturnValue(undefined);
    vi.mocked(getExchangeAsset).mockReturnValue(null);

    const fakeDex = { chain: 'ex1', exchangeChain: 'ex1Ex' } as unknown as ExchangeChain;
    vi.mocked(createExchangeInstance).mockReturnValue(fakeDex);

    await expect(
      selectBestExchangeCommon(baseOptions, undefined, () => Promise.resolve(0n)),
    ).rejects.toThrow(
      /Asset from.*could not be resolved/,
    );
  });

  it('throws RoutingResolutionError with clear message if assetTo is missing', async () => {
    vi.mocked(findAssetInfo).mockReturnValue({ symbol: 'AAA' } as TAssetInfo);
    vi.mocked(getExchangeAssetByOriginAsset).mockReturnValue({ symbol: 'AAA', decimals: 8 });
    vi.mocked(getExchangeAsset).mockReturnValueOnce({ symbol: 'AAA', decimals: 8 }); // assetFromExchange
    vi.mocked(getExchangeAsset).mockReturnValueOnce(null); // assetTo

    const fakeDex = { chain: 'ex1', exchangeChain: 'ex1Ex' } as unknown as ExchangeChain;
    vi.mocked(createExchangeInstance).mockReturnValue(fakeDex);

    await expect(
      selectBestExchangeCommon(baseOptions, undefined, () => Promise.resolve(0n)),
    ).rejects.toThrow(
      /Asset to.*could not be resolved/,
    );
  });
});
