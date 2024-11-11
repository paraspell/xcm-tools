import { describe, it, expect, vi } from 'vitest'
import type { ApiPromise } from '@polkadot/api'
import type { TNodeDotKsmWithRelayChains } from '../types'
import { createApiInstanceForNode } from './createApiInstanceForNode'
import { getNode } from './getNode'
import type { IPolkadotApi } from '../api/IPolkadotApi'
import type { Extrinsic } from '../pjs/types'

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

const mockApi = {
  createApiInstance: vi.fn()
} as unknown as IPolkadotApi<ApiPromise, Extrinsic>

describe('createApiInstanceForNode', () => {
  const mockApiPromise = {} as ApiPromise
  it('should create an ApiPromise instance for Polkadot', async () => {
    const spy = vi.spyOn(mockApi, 'createApiInstance').mockResolvedValueOnce(mockApiPromise)

    const result = await createApiInstanceForNode(mockApi, 'Polkadot')

    expect(spy).toHaveBeenCalledWith('wss://polkadotProvider.com')
    expect(result).toStrictEqual({})
  })

  it('should create an ApiPromise instance for Kusama', async () => {
    const spy = vi.spyOn(mockApi, 'createApiInstance').mockResolvedValueOnce(mockApiPromise)

    const result = await createApiInstanceForNode(mockApi, 'Kusama')

    expect(spy).toHaveBeenCalledWith('wss://kusamaProvider.com')
    expect(result).toBe(mockApiPromise)
  })

  it('should call getNode and create an ApiPromise instance for other nodes', async () => {
    const node = 'SomeOtherNode' as TNodeDotKsmWithRelayChains

    const result = await createApiInstanceForNode(mockApi, node)

    expect(getNode).toHaveBeenCalledWith(node)
    expect(result).toStrictEqual(mockApiPromise)
  })
})
