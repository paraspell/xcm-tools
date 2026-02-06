import type { ApiPromise } from '@polkadot/api';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { getDexConfig } from './getDexConfig';

const mkToken = (symbol: string, decimals = 12) => ({
  symbol,
  decimals,
  toCurrencyId: () => JSON.stringify({ Token: symbol }),
});

vi.mock('@acala-network/sdk', () => {
  class WalletMock {
    isReady = Promise.resolve();
    liquidity = {
      getAllEnabledPoolDetails: () => [
        { info: { pair: [mkToken('ACA'), mkToken('DOT')] } },
        { info: { pair: [mkToken('DOT'), mkToken('ASTR')] } },
      ],
    };
    getToken = (s: string) => mkToken(s);
  }
  return { Wallet: WalletMock };
});

vi.mock('@acala-network/sdk-core', () => ({
  FixedPointNumber: class {
    constructor(
      public v: string,
      public decimals: number,
    ) {}
  },
}));

vi.mock('@acala-network/sdk-swap', () => {
  class AcalaDexMock {
    constructor() {}
  }
  class AggregateDexMock {
    swap = vi.fn((cfg) => ({ subscribe: vi.fn(), cfg }));
  }
  return { AcalaDex: AcalaDexMock, AggregateDex: AggregateDexMock };
});

vi.mock('@paraspell/sdk', () => ({
  findAssetInfoById: vi.fn(() => ({
    symbol: 'DOT',
    assetId: '1',
    decimals: 12,
    location: { parents: 1, interior: 'Here' },
  })),
  getNativeAssets: vi.fn(() => [
    { symbol: 'ACA', decimals: 12, location: { Here: '' } },
    { symbol: 'DOT', decimals: 10, location: { parents: 1, interior: 'Here' } },
    {
      symbol: 'ASTR',
      decimals: 18,
      location: { parents: 1, interior: { X1: { Parachain: 2006 } } },
    },
  ]),
  getOtherAssets: vi.fn(() => [
    {
      symbol: 'DOT',
      assetId: '1',
      decimals: 12,
      location: { parents: 1, interior: 'Here' },
    },
  ]),
  RoutingResolutionError: class extends Error {},
}));

vi.mock('rxjs', () => {
  interface MockSwapObservable {
    cfg: { path: Array<{ symbol: string }> };
  }

  const firstValueFrom = vi.fn((obs: MockSwapObservable) => {
    const [a, b] = obs.cfg.path.map((t) => t.symbol);
    if (a === 'ACA' && b === 'ASTR') {
      return {};
    }
    throw new Error('no route');
  });

  return { firstValueFrom };
});

describe('getDexConfig', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns assets, direct pairs, and synthetic pairs', async () => {
    const cfg = await getDexConfig({} as ApiPromise, 'Acala');

    expect(cfg.assets.map((a) => a.symbol).sort()).toEqual(['ACA', 'ASTR', 'DOT']);

    const ACA_KEY = { Here: '' };
    const DOT_KEY = { parents: 1, interior: 'Here' };
    const ASTR_KEY = { parents: 1, interior: { X1: { Parachain: 2006 } } };
    expect(cfg.pairs).toEqual(
      expect.arrayContaining([
        [ACA_KEY, DOT_KEY],
        [DOT_KEY, ASTR_KEY],
      ]),
    );

    const hasSynthetic = cfg.pairs.some(
      ([x, y]) =>
        (JSON.stringify(x) === JSON.stringify(ACA_KEY) &&
          JSON.stringify(y) === JSON.stringify(ASTR_KEY)) ||
        (JSON.stringify(x) === JSON.stringify(ASTR_KEY) &&
          JSON.stringify(y) === JSON.stringify(ACA_KEY)),
    );
    expect(hasSynthetic).toBe(true);

    expect(cfg.isOmni).toBe(false);
  });
});
