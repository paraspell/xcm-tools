import { describe, expect, it } from 'vitest';

import {
  getExchangeAssets,
  getExchangeConfig,
  getExchangePairs,
  getSupportedAssetsFrom,
  getSupportedAssetsTo,
  getSupportedFeeAssets,
} from './assets';
import * as RouterBuilder from './builder/RouterBuilder';
import * as Consts from './consts';
import * as indexExports from './index';
import * as Types from './types';

describe('Index re-exports', () => {
  const moduleExports = indexExports as Record<string, unknown>;

  it('should re-export everything from types', () => {
    (Object.keys(Types) as Array<keyof typeof Types>).forEach((key) => {
      expect(moduleExports[key]).toBe(Types[key]);
    });
  });

  it('should re-export everything from consts', () => {
    (Object.keys(Consts) as Array<keyof typeof Consts>).forEach((key) => {
      expect(moduleExports[key]).toBe(Consts[key]);
    });
  });

  it('should re-export everything from builder/RouterBuilder', () => {
    (Object.keys(RouterBuilder) as Array<keyof typeof RouterBuilder>).forEach((key) => {
      expect(moduleExports[key]).toBe(RouterBuilder[key]);
    });
  });

  it('should specific functions from assets', () => {
    expect(moduleExports.getSupportedAssetsFrom).toBe(getSupportedAssetsFrom);
    expect(moduleExports.getSupportedAssetsTo).toBe(getSupportedAssetsTo);
    expect(moduleExports.getSupportedFeeAssets).toBe(getSupportedFeeAssets);
    expect(moduleExports.getExchangeAssets).toBe(getExchangeAssets);
    expect(moduleExports.getExchangeConfig).toBe(getExchangeConfig);
    expect(moduleExports.getExchangePairs).toBe(getExchangePairs);
  });
});
