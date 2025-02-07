import * as indexExports from './index';
import * as Transfer from './transfer/transfer';
import * as BuildTransactions from './transfer/buildTransactions';
import * as BuildApiTransactions from './transfer/buildApiTransactions';
import * as Types from './types';
import * as Consts from './consts';
import * as RouterBuilder from './builder/RouterBuilder';
import { getSupportedAssetsFrom, getSupportedAssetsTo } from './assets';
import { describe, it, expect } from 'vitest';

describe('Index re-exports', () => {
  const moduleExports = indexExports as Record<string, unknown>;

  it('should re-export everything from transfer/transfer', () => {
    (Object.keys(Transfer) as Array<keyof typeof Transfer>).forEach((key) => {
      expect(moduleExports[key]).toBe(Transfer[key]);
    });
  });

  it('should re-export everything from transfer/buildTransactions', () => {
    (Object.keys(BuildTransactions) as Array<keyof typeof BuildTransactions>).forEach((key) => {
      expect(moduleExports[key]).toBe(BuildTransactions[key]);
    });
  });

  it('should re-export everything from transfer/buildApiTransactions', () => {
    (Object.keys(BuildApiTransactions) as Array<keyof typeof BuildApiTransactions>).forEach(
      (key) => {
        expect(moduleExports[key]).toBe(BuildApiTransactions[key]);
      },
    );
  });

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

  it('should re-export getSupportedAssetsFrom and getSupportedAssetsTo from assets', () => {
    expect(moduleExports.getSupportedAssetsFrom).toBe(getSupportedAssetsFrom);
    expect(moduleExports.getSupportedAssetsTo).toBe(getSupportedAssetsTo);
  });
});
