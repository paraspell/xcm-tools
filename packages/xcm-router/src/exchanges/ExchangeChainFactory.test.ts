// Unit tests for ExchangeChainFactory

import { describe, expect, it } from 'vitest';

import { type TExchangeChain } from '../types';
import AcalaExchange from './Acala/AcalaExchange';
import BifrostExchange from './Bifrost/BifrostExchange';
import type ExchangeChain from './ExchangeChain';
import { createExchangeInstance } from './ExchangeChainFactory';
import HydrationExchange from './Hydration/HydrationExchange';

describe('createExchangeInstance', () => {
  const testCases: Array<{ chain: TExchangeChain; expectedClass: typeof ExchangeChain }> = [
    { chain: 'HydrationDex', expectedClass: HydrationExchange },
    { chain: 'AcalaDex', expectedClass: AcalaExchange },
    { chain: 'BifrostPolkadotDex', expectedClass: BifrostExchange },
  ];

  testCases.forEach(({ chain, expectedClass }) => {
    it(`should create an instance of ${expectedClass.name} for ${chain}`, () => {
      const exchangeChain = createExchangeInstance(chain);
      expect(exchangeChain).toBeInstanceOf(expectedClass);
    });
  });
});
