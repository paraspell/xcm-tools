import { createChainClient, type TChain } from '@paraspell/sdk-pjs';
import type { ApiPromise } from '@polkadot/api';
import { describe, expect, it, vi } from 'vitest';

import type { TSwapOptions } from '../types';
import BifrostExchange from './Bifrost/BifrostExchange';
import ExchangeChain from './ExchangeChain';

vi.mock('@paraspell/sdk-pjs', async () => {
  const actual = await vi.importActual('@paraspell/sdk-pjs');
  return {
    ...actual,
    createChainClient: vi.fn().mockResolvedValue('mockApiPromise'),
  };
});

class MockExchangeChain extends ExchangeChain {
  swapCurrency = vi.fn().mockResolvedValue({
    tx: 'mockTxHash',
    amountOut: 1000n,
  });

  getAmountOut = vi.fn();
  getDexConfig = vi.fn();
}

describe('ExchangeChain', () => {
  it('should create an Api instance correctly', async () => {
    const mockChain: TChain = 'BifrostPolkadot';
    const exchangeChain = new BifrostExchange(mockChain, 'BifrostPolkadotDex');
    const apiInstance = await exchangeChain.createApiInstance();
    expect(createChainClient).toHaveBeenCalledWith(mockChain);
    expect(apiInstance).toBe('mockApiPromise');
  });

  it('should return correct multi swap result using swapCurrency', async () => {
    const mockApi = {} as ApiPromise;
    const mockOptions = {} as TSwapOptions;
    const mockFee = 0 as unknown as BigNumber;

    const chain = new MockExchangeChain('Acala', 'AcalaDex');

    const result = await chain.handleMultiSwap(mockApi, mockOptions, mockFee);

    expect(chain.swapCurrency).toHaveBeenCalledWith(mockApi, mockOptions, mockFee);
    expect(result).toEqual({
      txs: ['mockTxHash'],
      amountOut: 1000n,
    });
  });
});
