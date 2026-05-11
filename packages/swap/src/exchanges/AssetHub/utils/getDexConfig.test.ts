import type { TPapiApi } from '@paraspell/sdk';
import { getAssets, localizeLocation, type TAssetInfo, type TLocation } from '@paraspell/sdk-core';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { getDexConfig } from './getDexConfig';

vi.mock('@paraspell/sdk-core', async (importOriginal) => ({
  ...(await importOriginal()),
  getAssets: vi.fn(),
  localizeLocation: vi.fn(),
}));

const makeAsset = (symbol: string, id: string, ml: object): TAssetInfo => ({
  symbol,
  assetId: id,
  decimals: 12,
  location: ml as TLocation,
});

// Stored asset locations use flat enum shape (PalletInstance/Parachain at the
// junction level, X1/X3/Here at the interior level).
const DOT_FLAT = { parents: 1, interior: { Here: null } };
const ACA_FLAT = { parents: 1, interior: { X1: [{ Parachain: 2000 }] } };
const OTHER_FLAT = {
  parents: 0,
  interior: { X1: [{ PalletInstance: 50 }] },
};
const USDT_FLAT = {
  parents: 0,
  interior: { X2: [{ PalletInstance: 50 }, { GeneralIndex: 1984 }] },
};

// Papi unsafe API decodes the same locations as variant-encoded enums,
// with u128 leaves (GeneralIndex) as bigint.
const DOT_PAPI = { parents: 1, interior: { type: 'Here', value: undefined } };
const ACA_PAPI = {
  parents: 1,
  interior: { type: 'X1', value: [{ type: 'Parachain', value: 2000 }] },
};
const USDT_PAPI = {
  parents: 0,
  interior: {
    type: 'X2',
    value: [
      { type: 'PalletInstance', value: 50 },
      { type: 'GeneralIndex', value: 1984n },
    ],
  },
};

const DOT_FA = makeAsset('DOT', '1', DOT_FLAT);
const ACA_FA = makeAsset('ACA', '2', ACA_FLAT);
const OTHER_FA = makeAsset('OTHER', '3', OTHER_FLAT);
const USDT_FA = makeAsset('USDT', '4', USDT_FLAT);

const makeApi = (entries: unknown[]) =>
  ({
    getUnsafeApi: () => ({
      query: {
        AssetConversion: {
          Pools: {
            getEntries: vi.fn().mockResolvedValue(entries),
          },
        },
      },
    }),
  }) as unknown as TPapiApi;

describe('getDexConfig', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(localizeLocation).mockImplementation((_chain, ml) => ml);
  });

  it('matches papi-decoded pool keys against stored asset locations', async () => {
    vi.mocked(getAssets).mockReturnValue([DOT_FA, ACA_FA, OTHER_FA]);

    const apiMock = makeApi([{ keyArgs: [[DOT_PAPI, ACA_PAPI]] }]);

    const cfg = await getDexConfig(apiMock, 'Acala');

    expect(cfg.assets).toEqual(expect.arrayContaining([DOT_FLAT, ACA_FLAT]));
    expect(cfg.assets.length).toBe(2);
    expect(cfg.pairs).toEqual([]);
    expect(cfg.isOmni).toBe(true);
  });

  it('returns empty assets when no pools exist on-chain', async () => {
    vi.mocked(getAssets).mockReturnValue([DOT_FA, ACA_FA]);

    const cfg = await getDexConfig(makeApi([]), 'AssetHubPolkadot');

    expect(cfg.assets).toEqual([]);
    expect(cfg.pairs).toEqual([]);
    expect(cfg.isOmni).toBe(true);
  });

  it('matches a u128 leaf (GeneralIndex bigint → number)', async () => {
    vi.mocked(getAssets).mockReturnValue([USDT_FA, DOT_FA]);

    const apiMock = makeApi([{ keyArgs: [[USDT_PAPI, DOT_PAPI]] }]);

    const cfg = await getDexConfig(apiMock, 'AssetHubPolkadot');

    expect(cfg.assets).toEqual(expect.arrayContaining([USDT_FLAT, DOT_FLAT]));
    expect(cfg.assets.length).toBe(2);
  });

  it('falls back to the localized location for cross-chain matches', async () => {
    const originalMl = { assetVersion: 'v1', network: 'Polkadot', id: 'uniqueAsset' };
    const localizedMl = { parents: 1, interior: { X1: [{ Parachain: 4000 }] } };

    const specialAsset = makeAsset('SPECIAL', 'sp_id', originalMl);
    vi.mocked(getAssets).mockReturnValue([specialAsset]);

    vi.mocked(localizeLocation).mockImplementation((_chain, ml) =>
      JSON.stringify(ml) === JSON.stringify(originalMl) ? localizedMl : ml,
    );

    const poolMlPapi = {
      parents: 1,
      interior: { type: 'X1', value: [{ type: 'Parachain', value: 4000 }] },
    };
    const apiMock = makeApi([{ keyArgs: [[poolMlPapi, ACA_PAPI]] }]);

    const cfg = await getDexConfig(apiMock, 'Moonbeam');

    expect(localizeLocation).toHaveBeenCalledWith('AssetHubPolkadot', originalMl);
    expect(cfg.assets).toEqual([originalMl]);
  });
});
