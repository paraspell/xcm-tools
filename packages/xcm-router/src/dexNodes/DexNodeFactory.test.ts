// Unit tests for DexNodeFactory

import { describe, expect, it } from 'vitest';

import { type TExchangeNode } from '../types';
import AcalaExchangeNode from './Acala/AcalaDex';
import BifrostExchangeNode from './Bifrost/BifrostDex';
import type ExchangeNode from './DexNode';
import { createDexNodeInstance } from './DexNodeFactory';
import HydrationExchangeNode from './Hydration/HydrationDex';

describe('createDexNodeInstance', () => {
  const testCases: Array<{ node: TExchangeNode; expectedClass: typeof ExchangeNode }> = [
    { node: 'HydrationDex', expectedClass: HydrationExchangeNode },
    { node: 'AcalaDex', expectedClass: AcalaExchangeNode },
    { node: 'BifrostPolkadotDex', expectedClass: BifrostExchangeNode },
  ];

  testCases.forEach(({ node, expectedClass }) => {
    it(`should create an instance of ${expectedClass.name} for ${node}`, () => {
      const dexNode = createDexNodeInstance(node);
      expect(dexNode).toBeInstanceOf(expectedClass);
    });
  });
});
