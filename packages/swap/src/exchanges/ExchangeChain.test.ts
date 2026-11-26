import { UnsupportedOperationError } from '@paraspell/sdk-core';
import { createChainClient, type TChain } from '@paraspell/sdk-pjs';
import { describe, expect, it, vi } from 'vitest';

import type { TPapiSwapOptions } from '../types';
import BifrostExchange from './Bifrost/BifrostExchange';
import HydrationExchange from './Hydration/HydrationExchange';

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

  it('rejects a swap recipient different from the sender when the exchange does not support it', async () => {
    const exchangeChain = new HydrationExchange('Hydration');

    await expect(
      exchangeChain.swapCurrency(
        { sender: 'sender', recipient: 'recipient' } as TPapiSwapOptions<unknown, unknown, unknown>,
        0n,
      ),
    ).rejects.toThrow(UnsupportedOperationError);
  });
});
