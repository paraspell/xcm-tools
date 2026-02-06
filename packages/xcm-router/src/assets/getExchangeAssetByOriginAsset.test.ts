import type { TAssetInfo } from '@paraspell/sdk';
import { deepEqual } from '@paraspell/sdk';
import { describe, expect, it, vi } from 'vitest';

import type { TRouterAsset } from '../types';
import { getExchangeAssetByOriginAsset } from './getExchangeAssetByOriginAsset';
import { getExchangeAssets } from './getExchangeConfig';

vi.mock('@paraspell/sdk');

vi.mock('./getExchangeConfig');

describe('getExchangeAssetByOriginAsset', () => {
  const originAsset: TAssetInfo = {
    symbol: 'ABC',
    decimals: 12,
    location: { parents: 1, interior: 'Here' },
  };

  const routerAssetA: TRouterAsset = {
    symbol: 'AAA',
    decimals: 12,
    location: { parents: 0, interior: 'Here' },
  };

  const routerAssetB: TRouterAsset = {
    symbol: 'BBB',
    decimals: 12,
    location: { parents: 1, interior: 'Here' },
  };

  it('returns undefined when no exchange assets match', () => {
    vi.mocked(getExchangeAssets).mockReturnValue([routerAssetA]);
    vi.mocked(deepEqual).mockReturnValue(false);

    const result = getExchangeAssetByOriginAsset('AcalaDex', originAsset);

    expect(result).toBeUndefined();
  });

  it('returns the matching exchange asset by location', () => {
    vi.mocked(getExchangeAssets).mockReturnValue([routerAssetA, routerAssetB]);
    vi.mocked(deepEqual).mockImplementation(
      (a, b) => a === routerAssetB.location && b === originAsset.location,
    );

    const result = getExchangeAssetByOriginAsset('AcalaDex', originAsset);

    expect(result).toBe(routerAssetB);
  });

  it('returns the first matching asset when multiple match', () => {
    const routerAssetC: TRouterAsset = {
      symbol: 'CCC',
      decimals: 12,
      location: { parents: 1, interior: 'Here' },
    };

    vi.mocked(getExchangeAssets).mockReturnValue([routerAssetB, routerAssetC]);
    vi.mocked(deepEqual).mockReturnValue(true);

    const result = getExchangeAssetByOriginAsset('AcalaDex', originAsset);

    expect(result).toBe(routerAssetB);
  });
});
