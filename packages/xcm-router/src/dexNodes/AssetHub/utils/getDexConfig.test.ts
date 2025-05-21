import {
  getAssets,
  type TAsset,
  type TMultiLocation,
  transformMultiLocation,
} from '@paraspell/sdk-pjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { getDexConfig } from './getDexConfig';

vi.mock('@paraspell/sdk-pjs', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@paraspell/sdk-pjs')>();
  return {
    ...actual, // Preserve other exports if any
    getAssets: vi.fn(),
    transformMultiLocation: vi.fn(),
  };
});

const makeAsset = (symbol: string, id: string, ml: object): TAsset => ({
  symbol,
  assetId: id,
  multiLocation: ml as TMultiLocation,
});

const DOT_ML = { Parachain: 1000 };
const ACA_ML = { Parachain: 2000 };
const OTHER_ML = { Parachain: 3000 };

const DOT_FA = makeAsset('DOT', '1', DOT_ML);
const ACA_FA = makeAsset('ACA', '2', ACA_ML);
const OTHER_FA = makeAsset('OTHER', '3', OTHER_ML);

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
    vi.mocked(transformMultiLocation).mockImplementation((ml) => ml);
  });

  it('returns filtered assets based on on-chain pools, empty pairs, and isOmni true', async () => {
    vi.mocked(getAssets).mockReturnValue([DOT_FA, ACA_FA, OTHER_FA]);

    const eraMock = { toJSON: () => [DOT_ML, ACA_ML] };
    const apiMock = makeApi([[{ args: [eraMock] }, {}]]);

    const cfg = await getDexConfig(apiMock, 'Acala');

    expect(cfg.assets).toEqual(
      expect.arrayContaining([
        { symbol: 'DOT', assetId: '1', multiLocation: DOT_ML },
        { symbol: 'ACA', assetId: '2', multiLocation: ACA_ML },
      ]),
    );
    expect(cfg.assets.length).toBe(2);

    expect(cfg.pairs).toEqual([]);

    expect(cfg.isOmni).toBe(true);

    expect(getAssets).toHaveBeenCalledWith('Acala');
    expect(apiMock.query.assetConversion.pools.entries).toHaveBeenCalled();
  });

  it('returns empty assets and pairs if no pools exist on-chain', async () => {
    vi.mocked(getAssets).mockReturnValue([DOT_FA, ACA_FA]);

    const apiMock = makeApi([]);

    const cfg = await getDexConfig(apiMock, 'AssetHubPolkadot');

    expect(cfg.assets).toEqual([]);
    expect(cfg.assets.length).toBe(0);

    expect(cfg.pairs).toEqual([]);
    expect(cfg.isOmni).toBe(true);

    expect(getAssets).toHaveBeenCalledWith('AssetHubPolkadot');
  });

  it('includes an asset if its transformed multiLocation matches a pool multiLocation', async () => {
    const poolMl = { parents: 1, interior: { X1: { Parachain: 4000 } } };

    const assetOriginalMl = { assetVersion: 'v1', network: 'Polkadot', id: 'uniqueAsset' };
    const assetTransformedMl = { parents: 1, interior: { X1: { Parachain: 4000 } } };

    const specialAsset = makeAsset('SPECIAL', 'sp_id', assetOriginalMl);
    vi.mocked(getAssets).mockReturnValue([specialAsset, DOT_FA]);

    vi.mocked(transformMultiLocation).mockImplementation((ml) => {
      if (JSON.stringify(ml) === JSON.stringify(assetOriginalMl)) {
        return assetTransformedMl as TMultiLocation;
      }
      return ml;
    });

    const eraMock = { toJSON: () => [poolMl, ACA_ML] };
    const apiMock = makeApi([[{ args: [eraMock] }, {}]]);

    const cfg = await getDexConfig(apiMock, 'Moonbeam');

    expect(transformMultiLocation).toHaveBeenCalledWith(assetOriginalMl);
    expect(cfg.assets.length).toBe(1);
    expect(cfg.assets).toEqual(
      expect.arrayContaining([
        { symbol: 'SPECIAL', assetId: 'sp_id', multiLocation: assetOriginalMl },
      ]),
    );

    expect(cfg.pairs).toEqual([]);
    expect(cfg.isOmni).toBe(true);
  });

  it('handles assets whose multiLocation directly matches a pool multiLocation (no transformation needed)', async () => {
    vi.mocked(getAssets).mockReturnValue([DOT_FA]);

    const eraMock = { toJSON: () => [DOT_ML, OTHER_ML] };
    const apiMock = makeApi([[{ args: [eraMock] }, {}]]);

    const cfg = await getDexConfig(apiMock, 'Acala');

    expect(cfg.assets.length).toBe(1);
    expect(cfg.assets[0].symbol).toBe('DOT');
    expect(cfg.isOmni).toBe(true);
    expect(cfg.pairs).toEqual([]);
  });
});
