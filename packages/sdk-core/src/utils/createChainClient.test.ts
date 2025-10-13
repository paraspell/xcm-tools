import { describe, expect, it, vi } from 'vitest'

import type { IPolkadotApi } from '../api/IPolkadotApi'
import { createChainClient } from './createChainClient'

const mockApiInstance = {}

const createMockApi = () => {
  const init = vi.fn().mockResolvedValue(undefined)
  const getApi = vi.fn().mockReturnValue(mockApiInstance)

  const api = {
    init,
    getApi
  } as unknown as IPolkadotApi<unknown, unknown>

  return { api, init, getApi }
}

describe('createChainClient', () => {
  it('initializes the provided api and returns the underlying instance', async () => {
    const { api, init, getApi } = createMockApi()

    const result = await createChainClient(api, 'Polkadot')

    expect(init).toHaveBeenCalledWith('Polkadot')
    expect(getApi).toHaveBeenCalledTimes(1)
    expect(result).toBe(mockApiInstance)
  })

  it('returns the api after awaiting initialization for another chain', async () => {
    const { api, init, getApi } = createMockApi()

    const result = await createChainClient(api, 'Moonbeam')

    expect(init).toHaveBeenCalledWith('Moonbeam')
    expect(getApi).toHaveBeenCalledTimes(1)
    expect(result).toBe(mockApiInstance)
  })
})
