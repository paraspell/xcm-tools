import type { TNodeDotKsmWithRelayChains } from '@paraspell/sdk-common'
import { describe, expect, it, vi } from 'vitest'

import type { IPolkadotApi } from '../api/IPolkadotApi'
import { getNodeProviders } from '../nodes/config'
import { createApiInstanceForNode } from './createApiInstanceForNode'

vi.mock('../nodes/config', () => ({
  getNodeProviders: vi.fn((node: TNodeDotKsmWithRelayChains) => {
    if (node === 'Polkadot') return 'wss://polkadot-rpc.publicnode.com'
    if (node === 'Kusama') return 'wss://kusama-rpc.publicnode.com'
    return 'wss://some-other-node-rpc.com'
  })
}))

const mockApiPromise = {}
const mockApi = {
  createApiInstance: vi.fn().mockResolvedValue(mockApiPromise)
} as unknown as IPolkadotApi<unknown, unknown>

describe('createApiInstanceForNode', () => {
  it('should create an ApiPromise instance with single url', async () => {
    const urls = ['wss://polkadot-rpc.publicnode.com']
    vi.mocked(getNodeProviders).mockReturnValueOnce(urls)
    const result = await createApiInstanceForNode(mockApi, 'Polkadot')

    expect(getNodeProviders).toHaveBeenCalledWith('Polkadot')
    expect(mockApi.createApiInstance).toHaveBeenCalledWith(urls)
    expect(result).toBe(mockApiPromise)
  })

  it('should create an ApiPromise instance with multiple urls', async () => {
    const urls = ['wss://altair-rpc.publicnode.com', 'wss://altair-rpc.publicnode.com']
    vi.mocked(getNodeProviders).mockReturnValueOnce(urls)
    const result = await createApiInstanceForNode(mockApi, 'Altair')

    expect(getNodeProviders).toHaveBeenCalledWith('Altair')
    expect(mockApi.createApiInstance).toHaveBeenCalledWith(urls)
    expect(result).toBe(mockApiPromise)
  })
})
