import type { TAssetInfo, TNodePolkadotKusama } from '@paraspell/sdk';
import { findAssetInfo, hasSupportForAsset } from '@paraspell/sdk';
import BigNumber from 'bignumber.js';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { getExchangeAsset, getExchangeAssetByOriginAsset } from '../assets';
import type ExchangeNode from '../dexNodes/DexNode';
import { createDexNodeInstance } from '../dexNodes/DexNodeFactory';
import Logger from '../Logger/Logger';
import type { TCommonTransferOptions, TExchangeNode } from '../types';
import { selectBestExchangeCommon } from './selectBestExchangeCommon';

vi.mock('@paraspell/sdk', () => ({
  findAssetInfo: vi.fn(),
  hasSupportForAsset: vi.fn(),
  getRelayChainOf: vi.fn(),
  InvalidParameterError: class extends Error {},
}));

vi.mock('../assets', () => ({
  getExchangeAsset: vi.fn(),
  getExchangeAssetByOriginAsset: vi.fn(),
}));

vi.mock('../dexNodes/DexNodeFactory', () => ({
  createDexNodeInstance: vi.fn(),
}));

vi.mock('./canBuildToExchangeTx', () => ({
  canBuildToExchangeTx: vi.fn().mockResolvedValue({ success: true }),
}));

vi.spyOn(Logger, 'log').mockImplementation(() => {});

const baseOptions = {
  from: 'originDex',
  to: 'destDex',
  currencyFrom: { symbol: 'AAA' },
  currencyTo: { symbol: 'BBB' },
} as unknown as TCommonTransferOptions;

describe('selectBestExchangeCommon', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('throws error if assetFromOrigin is not found', async () => {
    vi.mocked(findAssetInfo).mockReturnValue(null);
    await expect(
      selectBestExchangeCommon(baseOptions, undefined, () => Promise.resolve(new BigNumber(0))),
    ).rejects.toThrow(
      `Currency from ${JSON.stringify(baseOptions.currencyFrom)} not found in ${baseOptions.from}.`,
    );
  });

  it('throws error if currencyTo is specified by id', async () => {
    const options = { ...baseOptions, currencyTo: { id: 'some-id' } };
    vi.mocked(findAssetInfo).mockReturnValue({ symbol: 'AAA' } as TAssetInfo);
    await expect(
      selectBestExchangeCommon(options, undefined, () => Promise.resolve(new BigNumber(0))),
    ).rejects.toThrow(
      'Cannot select currencyTo by ID when auto-selecting is enabled. Please specify currencyTo by symbol or multi-location.',
    );
  });

  it('returns best exchange if one qualifies', async () => {
    vi.mocked(findAssetInfo).mockReturnValue({ symbol: 'AAA' } as TAssetInfo);
    vi.mocked(getExchangeAssetByOriginAsset).mockReturnValue({ symbol: 'AAA' });
    vi.mocked(getExchangeAsset).mockReturnValue({ symbol: 'BBB' });
    vi.mocked(hasSupportForAsset).mockReturnValue(true);

    const fakeDex1 = { node: 'ex1', exchangeNode: 'ex1Ex' } as unknown as ExchangeNode;
    const fakeDex2 = { node: 'ex2', exchangeNode: 'ex2Ex' } as unknown as ExchangeNode;

    vi.mocked(createDexNodeInstance).mockImplementation((exchangeNode) => {
      return exchangeNode === ('ex1' as TExchangeNode) ? fakeDex1 : fakeDex2;
    });

    const computeAmountOut = (dex: ExchangeNode) => {
      if (dex.node === ('ex1' as TNodePolkadotKusama)) return Promise.resolve(BigNumber(100));
      if (dex.node === ('ex2' as TNodePolkadotKusama)) return Promise.resolve(BigNumber(200));
      return Promise.resolve(BigNumber(0));
    };

    const originApi = undefined;

    const bestExchange = await selectBestExchangeCommon(baseOptions, originApi, computeAmountOut);
    expect(bestExchange).toBe(fakeDex2);
  });

  it('throws error if no exchange qualifies (assets not found)', async () => {
    vi.mocked(findAssetInfo).mockReturnValue({ symbol: 'AAA' } as TAssetInfo);
    vi.mocked(getExchangeAssetByOriginAsset).mockReturnValue(undefined);
    vi.mocked(getExchangeAsset).mockReturnValue(null);

    const fakeDex = { node: 'ex1', exchangeNode: 'ex1Ex' } as unknown as ExchangeNode;
    vi.mocked(createDexNodeInstance).mockReturnValue(fakeDex);

    await expect(
      selectBestExchangeCommon(baseOptions, undefined, () => Promise.resolve(BigNumber(0))),
    ).rejects.toThrow();
  });

  it('throws error with aggregated errors if computeAmountOut fails for all exchanges', async () => {
    vi.mocked(findAssetInfo).mockReturnValue({ symbol: 'AAA' } as TAssetInfo);
    vi.mocked(getExchangeAssetByOriginAsset).mockReturnValue({ symbol: 'AAA' });
    vi.mocked(getExchangeAsset).mockReturnValue({ symbol: 'BBB' });
    vi.mocked(hasSupportForAsset).mockReturnValue(true);

    const fakeDex1 = { node: 'ex1', exchangeNode: 'ex1Ex' } as unknown as ExchangeNode;
    const fakeDex2 = { node: 'ex2', exchangeNode: 'ex2Ex' } as unknown as ExchangeNode;

    vi.mocked(createDexNodeInstance).mockImplementation((exchangeNode) => {
      return exchangeNode === ('ex1' as TExchangeNode) ? fakeDex1 : fakeDex2;
    });

    const error1 = new Error('Error from ex1');
    const error2 = new Error('Error from ex2');
    const computeAmountOut = (dex: ExchangeNode) => {
      if (dex.node === ('ex1' as TNodePolkadotKusama)) throw error1;
      if (dex.node === ('ex2' as TNodePolkadotKusama)) throw error2;
      return Promise.resolve(new BigNumber(0));
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
    } as unknown as TCommonTransferOptions;

    vi.mocked(getExchangeAsset).mockReturnValueOnce({ symbol: 'AAA' });
    vi.mocked(getExchangeAsset).mockReturnValueOnce({ symbol: 'BBB' });
    vi.mocked(hasSupportForAsset).mockReturnValue(true);

    const fakeDex = { node: 'Acala', exchangeNode: 'AcalaDex' } as unknown as ExchangeNode;
    vi.mocked(createDexNodeInstance).mockReturnValue(fakeDex);

    const computeAmountOut = vi.fn().mockResolvedValue(new BigNumber(100));

    const bestExchange = await selectBestExchangeCommon(
      optionsWithoutFrom,
      undefined,
      computeAmountOut,
    );

    expect(bestExchange).toBe(fakeDex);
    expect(getExchangeAsset).toHaveBeenCalledWith('AcalaDex', optionsWithoutFrom.currencyFrom);
  });

  it('uses getExchangeAsset when from equals dex.node', async () => {
    const optionsWithSameNode = {
      ...baseOptions,
      from: 'Acala',
      exchange: ['AcalaDex'],
    } as unknown as TCommonTransferOptions;

    vi.mocked(findAssetInfo).mockReturnValue({ symbol: 'AAA' } as TAssetInfo);
    vi.mocked(getExchangeAsset).mockReturnValueOnce({ symbol: 'AAA' });
    vi.mocked(getExchangeAsset).mockReturnValueOnce({ symbol: 'BBB' });
    vi.mocked(hasSupportForAsset).mockReturnValue(true);

    const fakeDex = { node: 'Acala', exchangeNode: 'AcalaDex' } as unknown as ExchangeNode;
    vi.mocked(createDexNodeInstance).mockReturnValue(fakeDex);

    const computeAmountOut = vi.fn().mockResolvedValue(new BigNumber(100));

    const bestExchange = await selectBestExchangeCommon(
      optionsWithSameNode,
      undefined,
      computeAmountOut,
    );

    expect(bestExchange).toBe(fakeDex);
    expect(getExchangeAsset).toHaveBeenCalledWith('AcalaDex', optionsWithSameNode.currencyFrom);
  });
});
