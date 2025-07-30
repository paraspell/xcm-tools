import { options } from '@acala-network/api';
import type { TParachain } from '@paraspell/sdk';
import { getChainProviders } from '@paraspell/sdk';
import { ApiPromise, WsProvider } from '@polkadot/api';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { createAcalaClient } from './utils';

vi.mock('@polkadot/api', () => {
  const mockIsReady = vi.fn().mockResolvedValue(undefined);
  const MockApiPromise = vi.fn().mockImplementation(() => ({
    isReady: mockIsReady,
  }));

  const MockWsProvider = vi.fn();

  return {
    ApiPromise: MockApiPromise,
    WsProvider: MockWsProvider,
  };
});

vi.mock('@acala-network/api', () => ({
  options: vi.fn().mockReturnValue({ some: 'options' }),
}));

vi.mock('@paraspell/sdk', () => ({
  getChainProviders: vi.fn().mockReturnValue(['wss://mock-provider']),
}));

describe('createAcalaClient', () => {
  const mockChain = 'acala' as TParachain;
  const mockProvider = { connected: true } as unknown as WsProvider;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(WsProvider).mockImplementation(() => mockProvider);
  });

  test('should create API instance with correct configuration', async () => {
    const api = await createAcalaClient(mockChain);
    expect(getChainProviders).toHaveBeenCalledWith(mockChain);
    expect(WsProvider).toHaveBeenCalledWith(['wss://mock-provider']);
    expect(options).toHaveBeenCalledWith({ provider: mockProvider });
    expect(ApiPromise).toHaveBeenCalledWith({ some: 'options' });
    expect(api).toBeDefined();
    expect(api.isReady).toBeDefined();
  });

  test('should handle provider (or API) connection errors', async () => {
    const mockError = new Error('Connection failed');
    vi.mocked(ApiPromise).mockImplementationOnce(
      () =>
        ({
          isReady: Promise.reject(mockError),
        }) as unknown as ApiPromise,
    );
    await expect(createAcalaClient(mockChain)).rejects.toThrow('Connection failed');
  });

  test('should properly await API readiness', async () => {
    const mockIsReady = vi.fn().mockResolvedValue(true);
    vi.mocked(ApiPromise).mockImplementationOnce(
      () =>
        ({
          isReady: mockIsReady,
        }) as unknown as ApiPromise,
    );
    const api = await createAcalaClient(mockChain);
    expect(api).toBeDefined();
  });
});
