// Unit tests for DexNodeFactory

import { describe, it, expect } from 'vitest';
import AcalaExchangeNode from './Acala/AcalaDex';
import BifrostExchangeNode from './Bifrost/BifrostDex';
import HydraDxExchangeNode from './HydraDx/HydraDxDex';
import InterlayExchangeNode from './Interlay/InterlayDex';
import createDexNodeInstance from './DexNodeFactory';
import { type TExchangeNode } from '../types';
import type ExchangeNode from './DexNode';

describe('createDexNodeInstance', () => {
  const testCases: Array<{ node: TExchangeNode; expectedClass: typeof ExchangeNode }> = [
    { node: 'HydraDxDex', expectedClass: HydraDxExchangeNode },
    { node: 'AcalaDex', expectedClass: AcalaExchangeNode },
    { node: 'BifrostPolkadotDex', expectedClass: BifrostExchangeNode },
    { node: 'InterlayDex', expectedClass: InterlayExchangeNode },
  ];

  testCases.forEach(({ node, expectedClass }) => {
    it(`should create an instance of ${expectedClass.name} for ${node}`, () => {
      const dexNode = createDexNodeInstance(node);
      expect(dexNode).toBeInstanceOf(expectedClass);
    });
  });
});
