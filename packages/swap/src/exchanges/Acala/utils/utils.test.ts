import { options } from '@acala-network/api';
import type { TParachain } from '@paraspell/sdk';
import { getChainProviders } from '@paraspell/sdk';
import { ApiPromise, WsProvider } from '@polkadot/api';
import type { ApiOptions } from '@polkadot/api/types';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { createAcalaClient } from './utils';

vi.mock('@polkadot/api', () => ({
  ApiPromise: vi.fn(
    class {
      isReady = vi.fn();
    },
  ),
  WsProvider: vi.fn(
    class {
      connected = true;
    },
  ),
}));

vi.mock('@acala-network/api');
vi.mock('@paraspell/sdk');

describe('createAcalaClient', () => {
  const mockChain = 'acala' as TParachain;

  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(getChainProviders).mockReturnValue(['wss://mock-provider']);
    vi.mocked(options).mockReturnValue({ some: 'options' } as ApiOptions);
  });

  test('should create API instance with correct configuration', async () => {
    const api = await createAcalaClient(mockChain);
    expect(getChainProviders).toHaveBeenCalledWith(mockChain);
    expect(WsProvider).toHaveBeenCalledWith(['wss://mock-provider']);
    expect(options).toHaveBeenCalledWith({ provider: { connected: true } });
    expect(ApiPromise).toHaveBeenCalledWith({ some: 'options' });
    expect(api).toBeDefined();
    expect(api.isReady).toBeDefined();
  });

  test('should handle provider (or API) connection errors', async () => {
    const mockError = new Error('Connection failed');
    vi.mocked(ApiPromise).mockImplementation(
      class {
        isReady = Promise.reject(mockError);
      } as unknown as typeof ApiPromise,
    );
    await expect(createAcalaClient(mockChain)).rejects.toThrow('Connection failed');
  });

  test('should properly await API readiness', async () => {
    vi.mocked(ApiPromise).mockImplementation(
      class {
        isReady = vi.fn().mockResolvedValue(true);
      } as unknown as typeof ApiPromise,
    );
    const api = await createAcalaClient(mockChain);
    expect(api).toBeDefined();
  });
});
