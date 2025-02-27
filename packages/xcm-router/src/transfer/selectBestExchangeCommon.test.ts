import { describe, it, expect, vi, beforeEach } from 'vitest';
import BigNumber from 'bignumber.js';
import { selectBestExchangeCommon } from './selectBestExchangeCommon';
import { createDexNodeInstance } from '../dexNodes/DexNodeFactory';
import type { TAsset, TNodePolkadotKusama } from '@paraspell/sdk-pjs';
import { getAssetBySymbolOrId, hasSupportForAsset } from '@paraspell/sdk-pjs';
import { getExchangeAsset, getExchangeAssetByOriginAsset } from '../assets';
import Logger from '../Logger/Logger';
import type { TCommonTransferOptions, TExchangeNode } from '../types';
import type ExchangeNode from '../dexNodes/DexNode';

vi.mock('@paraspell/sdk-pjs', () => ({
  getAssetBySymbolOrId: vi.fn(),
  hasSupportForAsset: vi.fn(),
}));
vi.mock('../assets', () => ({
  getExchangeAsset: vi.fn(),
  getExchangeAssetByOriginAsset: vi.fn(),
}));
vi.mock('../dexNodes/DexNodeFactory', () => ({
  createDexNodeInstance: vi.fn(),
}));
vi.spyOn(Logger, 'log').mockImplementation(() => {});

const baseOptions = {
  from: 'originDex',
  to: 'destDex',
  currencyFrom: { symbol: 'AAA' },
  currencyTo: { symbol: 'BBB' },
} as unknown as TCommonTransferOptions;

beforeEach(() => {
  vi.clearAllMocks();
});

describe('selectBestExchangeCommon', () => {
  it('throws error if assetFromOrigin is not found', async () => {
    vi.mocked(getAssetBySymbolOrId).mockReturnValue(null);
    await expect(
      selectBestExchangeCommon(baseOptions, () => Promise.resolve(new BigNumber(0))),
    ).rejects.toThrow(
      `Currency from ${JSON.stringify(baseOptions.currencyFrom)} not found in ${baseOptions.from}.`,
    );
  });

  it('throws error if currencyTo is specified by id', async () => {
    const options = { ...baseOptions, currencyTo: { id: 'some-id' } };
    vi.mocked(getAssetBySymbolOrId).mockReturnValue({ symbol: 'AAA' } as TAsset);
    await expect(
      selectBestExchangeCommon(options, () => Promise.resolve(new BigNumber(0))),
    ).rejects.toThrow(
      'Cannot select currencyTo by ID when auto-selecting is enabled. Please specify currencyTo by symbol or MultiLocation.',
    );
  });

  it('returns best exchange if one qualifies', async () => {
    vi.mocked(getAssetBySymbolOrId).mockReturnValue({ symbol: 'AAA' } as TAsset);
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

    const bestExchange = await selectBestExchangeCommon(baseOptions, computeAmountOut);
    expect(bestExchange).toBe(fakeDex2);
  });

  it('throws error if no exchange qualifies (assets not found)', async () => {
    vi.mocked(getAssetBySymbolOrId).mockReturnValue({ symbol: 'AAA' } as TAsset);
    vi.mocked(getExchangeAssetByOriginAsset).mockReturnValue(undefined);
    vi.mocked(getExchangeAsset).mockReturnValue(null);

    const fakeDex = { node: 'ex1', exchangeNode: 'ex1Ex' } as unknown as ExchangeNode;
    vi.mocked(createDexNodeInstance).mockReturnValue(fakeDex);

    await expect(
      selectBestExchangeCommon(baseOptions, () => Promise.resolve(BigNumber(0))),
    ).rejects.toThrow();
  });

  it('throws error with aggregated errors if computeAmountOut fails for all exchanges', async () => {
    vi.mocked(getAssetBySymbolOrId).mockReturnValue({ symbol: 'AAA' } as TAsset);
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

    await expect(selectBestExchangeCommon(baseOptions, computeAmountOut)).rejects.toThrow();
  });
});
