import type { TSubstrateChain } from '@paraspell/sdk-common'
import { describe, expect, it, vi } from 'vitest'

import type { IPolkadotApi } from '../api/IPolkadotApi'
import { getChainProviders } from '../chains/config'
import { createChainClient } from './createChainClient'

vi.mock('../chains/config', () => ({
  getChainProviders: vi.fn((chain: TSubstrateChain) => {
    if (chain === 'Polkadot') return 'wss://polkadot-rpc.publicnode.com'
    if (chain === 'Kusama') return 'wss://kusama-rpc.publicnode.com'
    return 'wss://some-other-node-rpc.com'
  })
}))

const mockApiPromise = {}
const mockApi = {
  createApiInstance: vi.fn().mockResolvedValue(mockApiPromise)
} as unknown as IPolkadotApi<unknown, unknown>

describe('createChainClient', () => {
  it('should create an ApiPromise instance with single url', async () => {
    const chain = 'Polkadot'
    const urls = ['wss://polkadot-rpc.publicnode.com']
    vi.mocked(getChainProviders).mockReturnValueOnce(urls)
    const result = await createChainClient(mockApi, chain)

    expect(getChainProviders).toHaveBeenCalledWith(chain)
    expect(mockApi.createApiInstance).toHaveBeenCalledWith(urls, chain)
    expect(result).toBe(mockApiPromise)
  })

  it('should create an ApiPromise instance with multiple urls', async () => {
    const chain = 'Altair'
    const urls = ['wss://altair-rpc.publicnode.com', 'wss://altair-rpc.publicnode.com']
    vi.mocked(getChainProviders).mockReturnValueOnce(urls)
    const result = await createChainClient(mockApi, chain)

    expect(getChainProviders).toHaveBeenCalledWith(chain)
    expect(mockApi.createApiInstance).toHaveBeenCalledWith(urls, chain)
    expect(result).toBe(mockApiPromise)
  })
})
