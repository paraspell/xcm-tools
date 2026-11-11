import { createChainClient, type TChain } from '@paraspell/sdk-pjs';
import { describe, expect, it, vi } from 'vitest';

import BifrostExchange from './Bifrost/BifrostExchange';

vi.mock('@paraspell/sdk-pjs', async () => {
  const actual = await vi.importActual('@paraspell/sdk-pjs');
  return {
    ...actual,
    createChainClient: vi.fn().mockResolvedValue('mockApiPromise'),
  };
});

describe('ExchangeChain', () => {
  it('should create an Api instance correctly', async () => {
    const mockChain: TChain = 'BifrostPolkadot';
    const exchangeChain = new BifrostExchange(mockChain);
    const apiInstance = await exchangeChain.createApiInstance();
    expect(createChainClient).toHaveBeenCalledWith(mockChain, undefined);
    expect(apiInstance).toBe('mockApiPromise');
  });
});
