import { describe, it, expect, vi } from 'vitest'
import type { TNodeDotKsmWithRelayChains } from '../types'
import { createApiInstanceForNode } from './createApiInstanceForNode'
import { getNodeProviders } from '../nodes/config'
import type { IPolkadotApi } from '../api/IPolkadotApi'

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
    const urls = ['wss://acala-rpc.publicnode.com', 'wss://acala1-rpc.publicnode.com']
    vi.mocked(getNodeProviders).mockReturnValueOnce(urls)
    const result = await createApiInstanceForNode(mockApi, 'Acala')

    expect(getNodeProviders).toHaveBeenCalledWith('Acala')
    expect(mockApi.createApiInstance).toHaveBeenCalledWith(urls)
    expect(result).toBe(mockApiPromise)
  })
})
