// Unit tests for DexNode class

import { createApiInstanceForNode, type TNode } from '@paraspell/sdk-pjs';
import type { ApiPromise } from '@polkadot/api';
import { describe, expect, it, vi } from 'vitest';

import type { TSwapOptions } from '../types';
import BifrostExchangeNode from './Bifrost/BifrostDex';
import ExchangeNode from './DexNode';

vi.mock('@paraspell/sdk-pjs', async () => {
  const actual = await vi.importActual('@paraspell/sdk-pjs');
  return {
    ...actual,
    createApiInstanceForNode: vi.fn().mockResolvedValue('mockApiPromise'),
  };
});

class MockExchangeNode extends ExchangeNode {
  swapCurrency = vi.fn().mockResolvedValue({
    tx: 'mockTxHash',
    amountOut: 1000n,
  });

  getAmountOut = vi.fn();
  getDexConfig = vi.fn();
}

describe('ExchangeNode', () => {
  it('should create an Api instance correctly', async () => {
    const mockNode: TNode = 'BifrostPolkadot';
    const exchangeNode = new BifrostExchangeNode(mockNode, 'BifrostPolkadotDex');
    const apiInstance = await exchangeNode.createApiInstance();
    expect(createApiInstanceForNode).toHaveBeenCalledWith(mockNode);
    expect(apiInstance).toBe('mockApiPromise');
  });

  it('should return correct multi swap result using swapCurrency', async () => {
    const mockApi = {} as ApiPromise;
    const mockOptions = {} as TSwapOptions;
    const mockFee = 0 as unknown as BigNumber;

    const node = new MockExchangeNode('Acala', 'AcalaDex');

    const result = await node.handleMultiSwap(mockApi, mockOptions, mockFee);

    expect(node.swapCurrency).toHaveBeenCalledWith(mockApi, mockOptions, mockFee);
    expect(result).toEqual({
      txs: ['mockTxHash'],
      amountOut: 1000n,
    });
  });
});
