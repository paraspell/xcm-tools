// Unit tests for DexNode class

import { describe, it, expect, vi } from 'vitest';
import { type TNode, createApiInstanceForNode } from '@paraspell/sdk-pjs';
import BifrostExchangeNode from './Bifrost/BifrostDex';

vi.mock('@paraspell/sdk-pjs', async () => {
  const actual = await vi.importActual('@paraspell/sdk-pjs');
  return {
    ...actual,
    createApiInstanceForNode: vi.fn().mockResolvedValue('mockApiPromise'),
  };
});

describe('ExchangeNode', () => {
  it('should create an Api instance correctly', async () => {
    const mockNode: TNode = 'BifrostPolkadot';
    const exchangeNode = new BifrostExchangeNode(mockNode, 'BifrostPolkadotDex');
    const apiInstance = await exchangeNode.createApiInstance();
    expect(createApiInstanceForNode).toHaveBeenCalledWith(mockNode);
    expect(apiInstance).toBe('mockApiPromise');
  });
});
