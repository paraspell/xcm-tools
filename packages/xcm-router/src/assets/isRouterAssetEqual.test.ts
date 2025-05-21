import { deepEqual, normalizeSymbol } from '@paraspell/sdk';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { TRouterAsset } from '../types';
import { isRouterAssetEqual } from './isRouterAssetEqual';

vi.mock('@paraspell/sdk', () => ({
  deepEqual: vi.fn(),
  normalizeSymbol: vi.fn(),
}));

describe('isRouterAssetEqual', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(normalizeSymbol).mockImplementation((s) => (s ?? '').toUpperCase());
  });

  it('returns true if multiLocation is defined and deepEqual returns true', () => {
    const asset1: TRouterAsset = {
      symbol: 'DOT',
      multiLocation: { parents: 1, interior: { X1: { Parachain: 1000 } } },
    };
    const asset2: TRouterAsset = {
      symbol: 'DOT',
      multiLocation: { parents: 1, interior: { X1: { Parachain: 1000 } } },
    };

    vi.mocked(deepEqual).mockReturnValue(true);

    const result = isRouterAssetEqual(asset1, asset2);
    expect(deepEqual).toHaveBeenCalledWith(asset1.multiLocation, asset2.multiLocation);
    expect(result).toBe(true);
  });

  it('returns false if multiLocation is defined and deepEqual returns false', () => {
    const asset1: TRouterAsset = {
      symbol: 'DOT',
      multiLocation: { parents: 1, interior: { X1: { Parachain: 1000 } } },
    };
    const asset2: TRouterAsset = {
      symbol: 'DOT',
      multiLocation: { parents: 1, interior: { X1: { Parachain: 2000 } } },
    };

    vi.mocked(deepEqual).mockReturnValue(false);

    const result = isRouterAssetEqual(asset1, asset2);
    expect(result).toBe(false);
  });

  it('falls back to symbol comparison when multiLocation is undefined', () => {
    const asset1: TRouterAsset = {
      symbol: 'dot',
      multiLocation: undefined,
    };
    const asset2: TRouterAsset = {
      symbol: 'DOT',
      multiLocation: undefined,
    };

    const result = isRouterAssetEqual(asset1, asset2);
    expect(normalizeSymbol).toHaveBeenCalledWith('dot');
    expect(normalizeSymbol).toHaveBeenCalledWith('DOT');
    expect(result).toBe(true);
  });

  it('returns false if normalized symbols are different', () => {
    const asset1: TRouterAsset = {
      symbol: 'KSM',
      multiLocation: undefined,
    };
    const asset2: TRouterAsset = {
      symbol: 'DOT',
      multiLocation: undefined,
    };

    const result = isRouterAssetEqual(asset1, asset2);
    expect(result).toBe(false);
  });

  it('compares symbols when one multiLocation is undefined', () => {
    const asset1: TRouterAsset = {
      symbol: 'abc',
      multiLocation: undefined,
    };
    const asset2: TRouterAsset = {
      symbol: 'ABC',
      multiLocation: { parents: 1, interior: { X1: { Parachain: 1000 } } },
    };

    const result = isRouterAssetEqual(asset1, asset2);
    expect(result).toBe(true);
  });
});
