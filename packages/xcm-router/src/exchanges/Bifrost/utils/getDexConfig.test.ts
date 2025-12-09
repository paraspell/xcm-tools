/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Pair, Trade } from '@crypto-dex-sdk/amm';
import { getAssets } from '@paraspell/sdk';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { getBestTrade, getFilteredPairs } from './bifrostUtils';
import { getDexConfig } from './getDexConfig';

vi.mock('@paraspell/sdk', () => ({
  getParaId: vi.fn().mockReturnValue(2001),
  getAssets: vi.fn(),
}));

vi.mock('./bifrostUtils', () => {
  const getBestTrade = vi.fn();
  const getFilteredPairs = vi.fn();
  const findToken = vi.fn((map: any, symbol: string) => map[symbol]);
  const getTokenMap = vi.fn().mockReturnValue({
    BTC: {
      wrapped: {
        symbol: 'BTC',
        tokenInfo: { parachainId: 2001, assetType: 0, assetIndex: 0 },
      },
    },
    ETH: {
      wrapped: {
        symbol: 'ETH',
        tokenInfo: { parachainId: 2001, assetType: 0, assetIndex: 1 },
      },
    },
  });
  return { getBestTrade, getFilteredPairs, findToken, getTokenMap };
});

vi.mock('@crypto-dex-sdk/currency', () => {
  const getCurrencyCombinations = vi.fn().mockReturnValue(['combo']);
  class Token {
    constructor(readonly info: any) {
      Object.assign(this, info);
    }
  }
  const Amount = {
    fromRawAmount: vi.fn().mockReturnValue({}),
  };
  return { Token, getCurrencyCombinations, Amount };
});

const makeApi = (pairEntries: any[]) =>
  ({
    query: {
      zenlinkProtocol: {
        pairStatuses: { entries: vi.fn().mockResolvedValue(pairEntries) },
      },
    },
  }) as unknown as Parameters<typeof getDexConfig>[0];

const makeSdkAssets = () => [
  { symbol: 'btc', assetId: '1', decimals: 12, location: undefined },
  { symbol: 'eth', assetId: '2', decimals: 12, location: undefined },
];

describe('getDexConfig', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('builds asset list from tokenMap & SDK assets (no pairs)', async () => {
    vi.mocked(getAssets).mockReturnValue(makeSdkAssets());

    const api = makeApi([]);
    vi.mocked(getFilteredPairs).mockResolvedValue([]);
    vi.mocked(getBestTrade).mockImplementation(() => {
      throw new Error('no route');
    });

    const cfg = await getDexConfig(api, 'BifrostPolkadot');

    expect(cfg.isOmni).toBe(false);
    expect(cfg.assets.map((a) => a.symbol).sort()).toEqual(['BTC', 'ETH']);
    expect(cfg.pairs).toHaveLength(0);
  });

  it('includes on-chain pairs found in pairStatuses', async () => {
    vi.mocked(getAssets).mockReturnValue(makeSdkAssets());

    const keys = {
      toJSON: () => [
        { chainId: 2001, assetType: 0, assetIndex: 0 },
        { chainId: 2001, assetType: 0, assetIndex: 1 },
      ],
    };
    const api = makeApi([[{ args: [keys] }]]);

    vi.mocked(getFilteredPairs).mockResolvedValue([]);
    vi.mocked(getBestTrade).mockImplementation(() => {
      throw new Error('no route');
    });

    const cfg = await getDexConfig(api, 'BifrostPolkadot');

    expect(cfg.pairs).toEqual([['1', '2']]);
  });

  it('generates synthetic pair when a trade route exists', async () => {
    vi.mocked(getAssets).mockReturnValue(makeSdkAssets());

    const api = makeApi([]);

    vi.mocked(getFilteredPairs).mockResolvedValue(['dummy-route'] as unknown as Pair[]);

    vi.mocked(getBestTrade).mockImplementation(() => ({}) as Trade);

    const cfg = await getDexConfig(api, 'BifrostPolkadot');

    expect(cfg.pairs).toEqual([['1', '2']]);
  });
});
