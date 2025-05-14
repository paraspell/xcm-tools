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
  findAssetById: vi.fn(() => ({ symbol: 'DOT', assetId: '1' })),
  getNativeAssets: vi.fn(() => [{ symbol: 'ACA', multiLocation: { Here: '' } }]),
  getOtherAssets: vi.fn(() => [{ symbol: 'DOT', assetId: '1', multiLocation: undefined }]),
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
    expect(cfg.pairs).toEqual(
      expect.arrayContaining([
        [ACA_KEY, 'DOT'],
        ['DOT', 'ASTR'],
      ]),
    );

    const hasSynthetic = cfg.pairs.some(
      ([x, y]) =>
        (JSON.stringify(x) === JSON.stringify(ACA_KEY) && y === 'ASTR') ||
        (x === 'ASTR' && JSON.stringify(y) === JSON.stringify(ACA_KEY)),
    );
    expect(hasSynthetic).toBe(true);

    expect(cfg.isOmni).toBe(false);
  });
});
