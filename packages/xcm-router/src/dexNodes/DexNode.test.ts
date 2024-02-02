// Unit tests for DexNode class

import { describe, it, expect, vi } from 'vitest';
import { type TNode, createApiInstanceForNode } from '@paraspell/sdk';
import BifrostExchangeNode from './Bifrost/BifrostDex';

vi.mock('@paraspell/sdk', async () => {
  const actual = await vi.importActual('@paraspell/sdk');
  return {
    ...actual,
    createApiInstanceForNode: vi.fn().mockResolvedValue('mockApiPromise'),
  };
});

describe('ExchangeNode', () => {
  it('should create an Api instance correctly', async () => {
    const mockNode: TNode = 'BifrostPolkadot';
    const exchangeNode = new BifrostExchangeNode(mockNode);
    const apiInstance = await exchangeNode.createApiInstance();
    expect(createApiInstanceForNode).toHaveBeenCalledWith(mockNode);
    expect(apiInstance).toBe('mockApiPromise');
  });
});
