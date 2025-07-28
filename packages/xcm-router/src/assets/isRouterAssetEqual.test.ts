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

  it('returns true if location is defined and deepEqual returns true', () => {
    const asset1: TRouterAsset = {
      symbol: 'DOT',
      location: { parents: 1, interior: { X1: { Parachain: 1000 } } },
    };
    const asset2: TRouterAsset = {
      symbol: 'DOT',
      location: { parents: 1, interior: { X1: { Parachain: 1000 } } },
    };

    vi.mocked(deepEqual).mockReturnValue(true);

    const result = isRouterAssetEqual(asset1, asset2);
    expect(deepEqual).toHaveBeenCalledWith(asset1.location, asset2.location);
    expect(result).toBe(true);
  });

  it('returns false if location is defined and deepEqual returns false', () => {
    const asset1: TRouterAsset = {
      symbol: 'DOT',
      location: { parents: 1, interior: { X1: { Parachain: 1000 } } },
    };
    const asset2: TRouterAsset = {
      symbol: 'DOT',
      location: { parents: 1, interior: { X1: { Parachain: 2000 } } },
    };

    vi.mocked(deepEqual).mockReturnValue(false);

    const result = isRouterAssetEqual(asset1, asset2);
    expect(result).toBe(false);
  });

  it('falls back to symbol comparison when location is undefined', () => {
    const asset1: TRouterAsset = {
      symbol: 'dot',
      location: undefined,
    };
    const asset2: TRouterAsset = {
      symbol: 'DOT',
      location: undefined,
    };

    const result = isRouterAssetEqual(asset1, asset2);
    expect(normalizeSymbol).toHaveBeenCalledWith('dot');
    expect(normalizeSymbol).toHaveBeenCalledWith('DOT');
    expect(result).toBe(true);
  });

  it('returns false if normalized symbols are different', () => {
    const asset1: TRouterAsset = {
      symbol: 'KSM',
      location: undefined,
    };
    const asset2: TRouterAsset = {
      symbol: 'DOT',
      location: undefined,
    };

    const result = isRouterAssetEqual(asset1, asset2);
    expect(result).toBe(false);
  });

  it('compares symbols when one location is undefined', () => {
    const asset1: TRouterAsset = {
      symbol: 'abc',
      location: undefined,
    };
    const asset2: TRouterAsset = {
      symbol: 'ABC',
      location: { parents: 1, interior: { X1: { Parachain: 1000 } } },
    };

    const result = isRouterAssetEqual(asset1, asset2);
    expect(result).toBe(true);
  });
});
