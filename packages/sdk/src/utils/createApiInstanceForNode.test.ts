import { describe, it, expect, vi } from 'vitest'
import type { ApiPromise } from '@polkadot/api'
import type { TNodeWithRelayChains } from '../types'
import { createApiInstanceForNode } from './createApiInstanceForNode'
import { createApiInstance } from './createApiInstance'
import { getNode } from './getNode'

vi.mock('@polkadot/apps-config', () => ({
  prodRelayPolkadot: { providers: { Provider1: 'wss://polkadotProvider.com' } },
  prodRelayKusama: { providers: { Provider1: 'wss://kusamaProvider.com' } }
}))

vi.mock('./createApiInstance', () => ({
  createApiInstance: vi.fn().mockResolvedValue({} as ApiPromise)
}))

vi.mock('./getNode', () => ({
  getNode: vi
    .fn()
    .mockReturnValue({ createApiInstance: vi.fn().mockResolvedValue({} as ApiPromise) })
}))

describe('createApiInstanceForNode', () => {
  it('should create an ApiPromise instance for Polkadot', async () => {
    const result = await createApiInstanceForNode('Polkadot' as TNodeWithRelayChains)

    expect(createApiInstance).toHaveBeenCalledWith('wss://polkadotProvider.com')
    expect(result).toStrictEqual({})
  })

  it('should create an ApiPromise instance for Kusama', async () => {
    const mockApiInstance = {} as ApiPromise
    vi.mocked(createApiInstance).mockResolvedValue(mockApiInstance)

    const result = await createApiInstanceForNode('Kusama' as TNodeWithRelayChains)

    expect(createApiInstance).toHaveBeenCalledWith('wss://kusamaProvider.com')
    expect(result).toBe(mockApiInstance)
  })

  it('should call getNode and create an ApiPromise instance for other nodes', async () => {
    const node = 'SomeOtherNode' as TNodeWithRelayChains
    const mockApiInstance = {} as ApiPromise

    const result = await createApiInstanceForNode(node)

    expect(getNode).toHaveBeenCalledWith(node)
    expect(result).toStrictEqual(mockApiInstance)
  })
})
