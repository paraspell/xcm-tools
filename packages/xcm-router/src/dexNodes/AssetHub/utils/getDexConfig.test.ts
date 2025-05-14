import type { TAsset, TMultiLocation } from '@paraspell/sdk';
import { getAssets } from '@paraspell/sdk';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { getDexConfig } from './getDexConfig';

vi.mock('@paraspell/sdk', () => ({
  getAssets: vi.fn(),
}));

const makeAsset = (symbol: string, id: string, ml: object): TAsset => ({
  symbol,
  assetId: id,
  multiLocation: ml as TMultiLocation,
});

const DOT_FA = makeAsset('DOT', '1', { Parachain: 1000 });
const ACA_FA = makeAsset('ACA', '2', { Parachain: 2000 });

const makeApi = (entriesReturn: unknown[]) =>
  ({
    query: {
      assetConversion: {
        pools: {
          entries: vi.fn().mockResolvedValue(entriesReturn),
        },
      },
    },
  }) as unknown as import('@polkadot/api').ApiPromise;

describe('getDexConfig', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns transformed assets and pairs from on-chain pools', async () => {
    vi.mocked(getAssets).mockReturnValue([DOT_FA, ACA_FA]);

    const eraMock = { toJSON: () => [DOT_FA.multiLocation, ACA_FA.multiLocation] };
    const apiMock = makeApi([[{ args: [eraMock] }, {}]]);

    const cfg = await getDexConfig(apiMock, 'Acala');

    expect(cfg.assets).toEqual(
      expect.arrayContaining([
        { symbol: 'DOT', assetId: '1', multiLocation: DOT_FA.multiLocation },
        { symbol: 'ACA', assetId: '2', multiLocation: ACA_FA.multiLocation },
      ]),
    );

    expect(cfg.pairs).toEqual([[DOT_FA.multiLocation, ACA_FA.multiLocation]]);

    expect(cfg.isOmni).toBe(false);
    expect(getAssets).toHaveBeenCalledWith('Acala');
  });

  it('returns empty pairs when no pools exist', async () => {
    vi.mocked(getAssets).mockReturnValue([DOT_FA]);

    const apiMock = makeApi([]);

    const cfg = await getDexConfig(apiMock, 'AssetHubPolkadot');

    expect(cfg.pairs).toEqual([]);
    expect(cfg.assets.length).toBe(1);
  });
});
